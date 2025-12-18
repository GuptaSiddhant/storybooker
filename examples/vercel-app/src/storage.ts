// oxlint-disable max-lines
// oxlint-disable max-params
// oxlint-disable no-await-in-loop
// oxlint-disable class-methods-use-this
// oxlint-disable require-await

import { StorageAdapterErrors, type StorageAdapter } from "@storybooker/core/adapter";
import { del, head, list, put, type PutBlobResult } from "@vercel/blob";
import { Readable } from "node:stream";
import type { ReadableStream as ReadableStreamWeb } from "node:stream/web";

export class VercelBlobService implements StorageAdapter {
  #token: string;
  #baseUrl?: string;

  constructor(token: string, baseUrl?: string) {
    this.#token = token;
    this.#baseUrl = baseUrl;
  }

  metadata: StorageAdapter["metadata"] = {
    name: "Vercel Storage",
  };

  createContainer: StorageAdapter["createContainer"] = async (_containerId, _options) => {
    // Vercel Blob doesn't have explicit container creation
    // Containers are implicit through path prefixes
  };

  deleteContainer: StorageAdapter["deleteContainer"] = async (containerId, options) => {
    try {
      const containerPrefix = this.#getContainerPrefix(containerId);

      // List all blobs with the container prefix
      const { blobs } = await list({
        abortSignal: options.abortSignal,
        prefix: containerPrefix,
        token: this.#token,
        ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
      });

      if (blobs.length === 0) {
        throw new StorageAdapterErrors.ContainerDoesNotExistError(containerId);
      }

      // Delete all blobs in the container
      const urls = blobs.map((blob) => blob.url);
      if (urls.length > 0) {
        await del(urls, {
          abortSignal: options.abortSignal,
          token: this.#token,
          ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
        });
      }
    } catch (error) {
      if (error instanceof StorageAdapterErrors.ContainerDoesNotExistError) {
        throw error;
      }
      throw new StorageAdapterErrors.ContainerDoesNotExistError(containerId, error);
    }
  };

  hasContainer: StorageAdapter["hasContainer"] = async (containerId, _options) => {
    try {
      const containerPrefix = this.#getContainerPrefix(containerId);

      // Check if any blobs exist with this prefix
      const { blobs } = await list({
        limit: 1,
        prefix: containerPrefix,
        token: this.#token,
        ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
      });

      return blobs.length > 0;
    } catch {
      return false;
    }
  };

  listContainers: StorageAdapter["listContainers"] = async (_options) => {
    try {
      // List all blobs and extract unique container prefixes
      const { blobs } = await list({
        token: this.#token,
        ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
      });

      const containers = new Set<string>();
      for (const blob of blobs) {
        const { pathname } = blob;
        const firstSlashIndex = pathname.indexOf("/", 1); // Skip the leading slash
        if (firstSlashIndex > 0) {
          const containerId = pathname.slice(1, firstSlashIndex);
          containers.add(containerId);
        }
      }

      return [...containers];
    } catch (error) {
      throw new StorageAdapterErrors.CustomError(undefined, `Failed to list containers: ${error}`);
    }
  };

  deleteFiles: StorageAdapter["deleteFiles"] = async (containerId, filePathsOrPrefix, options) => {
    try {
      const urls: string[] = [];

      if (typeof filePathsOrPrefix === "string") {
        // Delete by prefix
        const fullPrefix = this.#getFilePath(containerId, filePathsOrPrefix);
        const { blobs } = await list({
          prefix: fullPrefix,
          token: this.#token,
          ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
        });
        urls.push(...blobs.map((blob) => blob.url));
      } else {
        // Delete specific files
        for (const filepath of filePathsOrPrefix) {
          const fullPath = this.#getFilePath(containerId, filepath);
          try {
            const blob = await head(fullPath, {
              token: this.#token,
              ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
            });
            urls.push(blob.url);
          } catch {
            // File doesn't exist, skip it
            options.logger?.debug?.(`File not found, skipping: ${fullPath}`);
          }
        }
      }

      if (urls.length > 0) {
        await del(urls, {
          token: this.#token,
          ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
        });
      }
    } catch (error) {
      throw new StorageAdapterErrors.CustomError(
        undefined,
        `Failed to delete files in container ${containerId}: ${error}`,
      );
    }
  };

  uploadFiles: StorageAdapter["uploadFiles"] = async (containerId, files, options) => {
    const { errors } = await promisePool(
      files.map(({ content, path, mimeType }) => async (): Promise<PutBlobResult> => {
        return await this.#uploadFile(containerId, path, content, mimeType, options.abortSignal);
      }),
      20, // Concurrency limit
    );

    if (errors.length > 0) {
      options.logger.error(`Failed to upload ${errors.length} files. Errors:`, errors);
    }
  };

  hasFile: StorageAdapter["hasFile"] = async (containerId, filepath, _options) => {
    try {
      const fullPath = this.#getFilePath(containerId, filepath);
      await head(fullPath, {
        token: this.#token,
        ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
      });
      return true;
    } catch {
      return false;
    }
  };

  downloadFile: StorageAdapter["downloadFile"] = async (containerId, filepath, options) => {
    try {
      const fullPath = this.#getFilePath(containerId, filepath);
      const blob = await head(fullPath, {
        token: this.#token,
        ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
      });

      // Create a ReadableStream from the blob URL
      const response = await fetch(blob.url, {
        signal: options.abortSignal,
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      if (!response.body) {
        throw new StorageAdapterErrors.FileMalformedError(
          containerId,
          filepath,
          "No readable stream body found.",
        );
      }

      return {
        content: response.body,
        mimeType: blob.contentType || "application/octet-stream",
        path: filepath,
      };
    } catch (error) {
      throw new StorageAdapterErrors.FileDoesNotExistError(containerId, filepath, error);
    }
  };

  // Helper methods
  #getContainerPrefix(containerId: string): string {
    return `${containerId}/`;
  }

  #getFilePath(containerId: string, filepath: string): string {
    return `${containerId}/${filepath}`;
  }

  async #uploadFile(
    containerId: string,
    filepath: string,
    content: Blob | string | ReadableStream,
    mimeType: string,
    abortSignal?: AbortSignal,
  ): Promise<PutBlobResult> {
    const fullPath = this.#getFilePath(containerId, filepath);

    if (typeof content === "string") {
      return await put(fullPath, content, {
        abortSignal,
        access: "public",
        contentType: mimeType,
        token: this.#token,
        ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
      });
    }

    if (content instanceof Blob) {
      return await put(fullPath, content, {
        abortSignal,
        access: "public",
        contentType: mimeType,
        token: this.#token,
        ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
      });
    }

    if (content instanceof ReadableStream) {
      // Convert ReadableStream to Node.js Readable, then to Blob
      const readable = Readable.fromWeb(content as ReadableStreamWeb);
      const chunks: Uint8Array[] = [];

      for await (const chunk of readable) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      const blob = new Blob([buffer], { type: mimeType });

      return await put(fullPath, blob, {
        abortSignal,
        access: "public",
        contentType: mimeType,
        token: this.#token,
        ...(this.#baseUrl && { baseUrl: this.#baseUrl }),
      });
    }

    throw new Error(`Unknown content type: ${typeof content}`);
  }
}

async function promisePool<Result>(
  tasks: (() => Promise<Result>)[],
  concurrencyLimit: number,
): Promise<{ errors: unknown[]; results: Result[] }> {
  const promises: Promise<Result>[] = [];
  const errors: unknown[] = [];
  const executing = new Set();

  for (const task of tasks) {
    // Start the taskPromise
    const promise = Promise.resolve().then(task);
    promises.push(promise);

    // Add to executing set
    executing.add(promise);

    // When the promise settles, remove it from executing
    const cleanup = (): boolean => executing.delete(promise);
    promise.then(cleanup).catch((error: unknown) => {
      errors.push(error);
      cleanup();
    });

    // If the number of running promises hit concurrencyLimit, wait for one to finish
    if (executing.size >= concurrencyLimit) {
      // oxlint-disable-next-line no-await-in-loop
      await Promise.race(executing);
    }
  }

  // Wait for all remaining tasks to finish
  const results = await Promise.all(promises);

  return { errors, results };
}
