import type { Buffer } from "node:buffer";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { Readable, type Stream } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import type { LoggerAdapter } from "./logger";

/**
 * Service adapter to interact with file-storage.
 *
 * @description
 * The adapter should provide callbacks to perform operations
 * to an existing storage like upload and download files.
 *
 * - `container`: A container/group/bucket to hold files. Each project has one container.
 * - `file`: A single binary that can individually stored and retrieved.
 */
export interface StorageAdapter {
  /**
   * An optional method that is called on app boot-up
   * to run async setup functions.
   * @param options Common options like abortSignal.
   * @throws if an error occur during initialisation.
   */
  init?: (options: StorageAdapterOptions) => Promise<void>;

  // Containers

  /**
   * List all containers available in the storage.
   * @param options Common options like abortSignal.
   * @returns A list of names/IDs of the containers.
   * @throws If the Storage service is not connected.
   */
  listContainers: (options: StorageAdapterOptions) => Promise<string[]>;

  /**
   * Create a container used for different projects.
   * @param containerId ID of the container
   * @param options Common options like abortSignal.
   * @throws if container with ID already exists.
   */
  createContainer: (
    containerId: string,
    options: StorageAdapterOptions,
  ) => Promise<void>;

  /**
   * Delete an existing container.
   * @param containerId ID of the container
   * @param options Common options like abortSignal.
   * @throws if container with ID does not exist.
   */
  deleteContainer: (
    containerId: string,
    options: StorageAdapterOptions,
  ) => Promise<void>;

  /**
   * Check if container exists.
   * @param containerId ID of the container
   * @param options Common options like abortSignal.
   * @returns if container is available of not
   * @throws never.
   */
  hasContainer: (
    containerId: string,
    options: StorageAdapterOptions,
  ) => Promise<boolean>;

  // Files

  /**
   * Upload multiple files to the storage container
   * @param containerId ID of the container
   * @param files List of files with path, data and metadata
   * @param options Common options like abortSignal
   * @throws if the the container does not exists
   */
  uploadFiles: (
    containerId: string,
    files: StoryBookerFile[],
    options: StorageAdapterOptions,
  ) => Promise<void>;

  /**
   * Delete multiple files by their paths or a shared prefix.
   * @param containerId ID of the container
   * @param filePathsOrPrefix
   * Either a list of complete filepaths or
   * a single string representing the shared path (prefix).
   * @param options Common options like abortSignal
   * @throws if the the container does not exists but NOT if file(s) does not exists
   */
  deleteFiles: (
    containerId: string,
    filePathsOrPrefix: string | string[],
    options: StorageAdapterOptions,
  ) => Promise<void>;

  /**
   * Check if a file exists in the storage container
   * @param containerId ID of the container
   * @param filepath Path of the file
   * @param options Common options like abortSignal
   * @returns if the file exists or not
   * @throws if the the container does not exists
   */
  hasFile: (
    containerId: string,
    filepath: string,
    options: StorageAdapterOptions,
  ) => Promise<boolean>;

  /**
   * Download a single file from the storage container
   * @param containerId ID of the container
   * @param filepath Path of the file
   * @param options Common options like abortSignal
   * @returns StoryBooker file data
   * @throws if the the container or file does not exists
   */
  downloadFile: (
    containerId: string,
    filepath: string,
    options: StorageAdapterOptions,
  ) => Promise<Partial<StoryBookerFile>>;
}

/** Common Storage adapter options.  */
export interface StorageAdapterOptions {
  /** A signal that can be used to cancel the request handling. */
  abortSignal?: AbortSignal;
  /** Logger */
  logger: LoggerAdapter;
}

/** Shape of file/blob */
export interface StoryBookerFile {
  content: Blob | ReadableStream | string;
  mimeType: string;
  path: string;
}

/**
 * Storage adapter for StoryBooker while uses
 * the local filesystem to read from and write files to.
 * It uses NodeJS FS API to read/write to filesystem.
 *
 * It is useful for testing and playground
 * but not recommended for heavy traffic.
 *
 * Usage:
 * ```ts
 * const storage = new LocalFileStorage("./store/");
 * ```
 */
export class LocalFileStorage implements StorageAdapter {
  #basePath: string;

  constructor(pathPrefix = ".") {
    this.#basePath = path.resolve(pathPrefix);
  }

  #genPath(...pathParts: (string | undefined)[]): string {
    return path.join(
      this.#basePath,
      ...pathParts.filter((part) => part !== undefined),
    );
  }

  // Containers

  createContainer: StorageAdapter["createContainer"] = async (
    containerId,
    _options,
  ) => {
    await fsp.mkdir(this.#genPath(containerId), { recursive: true });
  };

  deleteContainer: StorageAdapter["deleteContainer"] = async (containerId) => {
    await fsp.rm(this.#genPath(containerId), { force: true, recursive: true });
  };

  hasContainer: StorageAdapter["hasContainer"] = async (containerId) => {
    return fs.existsSync(this.#genPath(containerId));
  };

  listContainers: StorageAdapter["listContainers"] = async () => {
    const containers: string[] = [];
    const entries = await fsp.readdir(this.#genPath(), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        containers.push(entry.name);
      }
    }
    return containers;
  };

  // Files

  deleteFiles: StorageAdapter["deleteFiles"] = async (
    containerId,
    filePathsOrPrefix,
  ): Promise<void> => {
    if (typeof filePathsOrPrefix === "string") {
      await fsp.rm(this.#genPath(containerId, filePathsOrPrefix), {
        force: true,
        recursive: true,
      });
    } else {
      for (const filepath of filePathsOrPrefix) {
        // oxlint-disable-next-line no-await-in-loop
        await fsp.rm(filepath, { force: true, recursive: true });
      }
    }
  };

  hasFile: StorageAdapter["hasFile"] = async (containerId, filepath) => {
    const path = this.#genPath(containerId, filepath);
    return fs.existsSync(path);
  };

  downloadFile: StorageAdapter["downloadFile"] = async (
    containerId,
    filepath,
  ) => {
    const path = this.#genPath(containerId, filepath);
    const buffer = await fsp.readFile(path);
    const content = new Blob([buffer as Buffer<ArrayBuffer>]);
    return { content, path };
  };

  uploadFiles: StorageAdapter["uploadFiles"] = async (
    containerId,
    files,
    options,
  ) => {
    for (const file of files) {
      const filepath = this.#genPath(containerId, file.path);
      const dirpath = path.dirname(filepath);

      await fsp.mkdir(dirpath, { recursive: true });
      if (file.content instanceof ReadableStream) {
        await writeWebStreamToFile(file.content, filepath);
      } else {
        const data: string | Stream =
          // oxlint-disable-next-line no-nested-ternary
          typeof file.content === "string"
            ? file.content
            : await file.content.text();

        await fsp.writeFile(filepath, data, {
          encoding: "utf8",
          signal: options.abortSignal,
        });
      }
    }
  };
}

function writeWebStreamToFile(
  webReadableStream: ReadableStream,
  outputPath: string,
): Promise<null> {
  // Convert WebReadableStream to Node.js Readable stream
  const nodeReadableStream = Readable.fromWeb(
    webReadableStream as WebReadableStream,
  );

  // Create a writable file stream
  const fileWritableStream = fs.createWriteStream(outputPath);

  // Pipe the Node.js readable stream to the writable file stream
  nodeReadableStream.pipe(fileWritableStream);

  // Return a promise that resolves when writing is finished
  return new Promise((resolve, reject) => {
    fileWritableStream.on("finish", () => {
      resolve(null);
    });
    fileWritableStream.on("error", reject);
  });
}
