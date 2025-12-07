import { Readable } from "node:stream";
import type streamWeb from "node:stream/web";
import type { BlobClient, BlobServiceClient, BlockBlobClient } from "@azure/storage-blob";
import { StorageAdapterErrors, type StorageAdapter } from "@storybooker/core/adapter";

export class AzureBlobStorageService implements StorageAdapter {
  #client: BlobServiceClient;

  constructor(client: BlobServiceClient) {
    this.#client = client;
  }

  metadata: StorageAdapter["metadata"] = { name: "AzureBlobStorageService" };

  createContainer: StorageAdapter["createContainer"] = async (containerId, options) => {
    try {
      const containerName = genContainerNameFromContainerId(containerId);
      await this.#client.createContainer(containerName, {
        abortSignal: options.abortSignal,
      });
    } catch (error) {
      throw new StorageAdapterErrors.ContainerAlreadyExistsError(containerId, error);
    }
  };

  deleteContainer: StorageAdapter["deleteContainer"] = async (containerId, options) => {
    try {
      const containerName = genContainerNameFromContainerId(containerId);
      await this.#client.getContainerClient(containerName).deleteIfExists({
        abortSignal: options.abortSignal,
      });
    } catch (error) {
      throw new StorageAdapterErrors.ContainerDoesNotExistError(containerId, error);
    }
  };

  hasContainer: StorageAdapter["hasContainer"] = async (containerId, options) => {
    const containerName = genContainerNameFromContainerId(containerId);
    return await this.#client.getContainerClient(containerName).exists({
      abortSignal: options.abortSignal,
    });
  };

  listContainers: StorageAdapter["listContainers"] = async (options) => {
    const containers: string[] = [];
    for await (const item of this.#client.listContainers({
      abortSignal: options.abortSignal,
    })) {
      containers.push(item.name);
    }

    return containers;
  };

  deleteFiles: StorageAdapter["deleteFiles"] = async (containerId, filePathsOrPrefix, options) => {
    const containerName = genContainerNameFromContainerId(containerId);
    const containerClient = this.#client.getContainerClient(containerName);
    const blobClientsToDelete: BlobClient[] = [];

    if (typeof filePathsOrPrefix === "string") {
      for await (const blob of containerClient.listBlobsFlat({
        abortSignal: options.abortSignal,
        prefix: filePathsOrPrefix,
      })) {
        blobClientsToDelete.push(containerClient.getBlobClient(blob.name));
      }
    } else {
      for (const filepath of filePathsOrPrefix) {
        blobClientsToDelete.push(containerClient.getBlobClient(filepath));
      }
    }

    if (blobClientsToDelete.length === 0) {
      return;
    }

    const response = await containerClient.getBlobBatchClient().deleteBlobs(blobClientsToDelete, {
      abortSignal: options.abortSignal,
    });

    if (response.errorCode) {
      throw new StorageAdapterErrors.CustomError(
        undefined,
        `Failed to delete ${response.subResponsesFailedCount} blobs in container ${containerId}: ${response.errorCode}`,
      );
    }
    return;
  };

  uploadFiles: StorageAdapter["uploadFiles"] = async (containerId, files, options) => {
    const containerName = genContainerNameFromContainerId(containerId);
    const containerClient = this.#client.getContainerClient(containerName);

    const { errors } = await promisePool(
      files.map(({ content, path, mimeType }) => async (): Promise<void> => {
        await uploadFileToBlobStorage(
          containerClient.getBlockBlobClient(path),
          content,
          mimeType,
          options.abortSignal,
        );
      }),
      20,
    );

    if (errors.length > 0) {
      options.logger.error(`Failed to upload ${errors.length} files. Errors:`, errors);
    }
  };

  hasFile: StorageAdapter["hasFile"] = async (containerId, filepath, options) => {
    const containerName = genContainerNameFromContainerId(containerId);
    const containerClient = this.#client.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(filepath);
    return await blockBlobClient.exists({ abortSignal: options.abortSignal });
  };

  downloadFile: StorageAdapter["downloadFile"] = async (containerId, filepath, options) => {
    const containerName = genContainerNameFromContainerId(containerId);
    const containerClient = this.#client.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(filepath);

    if (!(await blockBlobClient.exists())) {
      throw new StorageAdapterErrors.FileDoesNotExistError(containerId, filepath);
    }

    const downloadResponse = await blockBlobClient.download(0, undefined, {
      abortSignal: options.abortSignal,
    });

    if (!downloadResponse.readableStreamBody) {
      throw new StorageAdapterErrors.FileMalformedError(
        containerId,
        filepath,
        "No readable stream body found.",
      );
    }

    return {
      content: downloadResponse.readableStreamBody as unknown as ReadableStream,
      mimeType: downloadResponse.contentType,
      path: filepath,
    };
  };
}

function genContainerNameFromContainerId(containerId: string): string {
  return containerId
    .replaceAll(/[^\w-]+/g, "-")
    .slice(0, 255)
    .toLowerCase();
}

// oxlint-disable-next-line max-params
async function uploadFileToBlobStorage(
  client: BlockBlobClient,
  data: Blob | string | ReadableStream,
  mimeType: string,
  abortSignal?: AbortSignal,
): Promise<void> {
  if (typeof data === "string") {
    const blob = new Blob([data], { type: mimeType });
    await client.uploadData(blob, {
      abortSignal,
      blobHTTPHeaders: { blobContentType: mimeType },
    });
    return;
  }

  if (data instanceof Blob) {
    await client.uploadData(data, {
      abortSignal,
      blobHTTPHeaders: { blobContentType: mimeType },
    });
    return;
  }

  if (data instanceof ReadableStream) {
    const stream = data as unknown as streamWeb.ReadableStream;
    await client.uploadStream(Readable.fromWeb(stream), undefined, undefined, {
      abortSignal,
      blobHTTPHeaders: { blobContentType: mimeType },
    });
    return;
  }

  throw new Error(`Unknown file type`);
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
