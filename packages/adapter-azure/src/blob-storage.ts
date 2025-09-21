import { Readable } from "node:stream";
import type streamWeb from "node:stream/web";
import {
  BlobServiceClient,
  type BlobClient,
  type BlockBlobClient,
} from "@azure/storage-blob";
import type { StorageService } from "@storybooker/core/types";

export class AzureBlobStorageService implements StorageService {
  #client: BlobServiceClient;

  constructor(connectionString: string) {
    this.#client = BlobServiceClient.fromConnectionString(connectionString);
  }

  createContainer: StorageService["createContainer"] = async (
    containerId,
    options,
  ) => {
    await this.#client.createContainer(containerId, {
      abortSignal: options.abortSignal,
    });
  };

  deleteContainer: StorageService["deleteContainer"] = async (
    containerId,
    options,
  ) => {
    await this.#client.getContainerClient(containerId).deleteIfExists({
      abortSignal: options.abortSignal,
    });
  };

  hasContainer: StorageService["hasContainer"] = async (
    containerId,
    options,
  ) => {
    return await this.#client.getContainerClient(containerId).exists({
      abortSignal: options.abortSignal,
    });
  };

  listContainers: StorageService["listContainers"] = async (options) => {
    const containers: string[] = [];
    for await (const item of this.#client.listContainers({
      abortSignal: options.abortSignal,
    })) {
      containers.push(item.name);
    }

    return containers;
  };

  deleteFiles: StorageService["deleteFiles"] = async (
    containerId,
    filePathsOrPrefix,
    options,
  ) => {
    const containerClient = this.#client.getContainerClient(containerId);
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

    const response = await containerClient
      .getBlobBatchClient()
      .deleteBlobs(blobClientsToDelete, {
        abortSignal: options.abortSignal,
      });

    if (response.errorCode) {
      throw new Error(`Failed to delete blobs: ${response.errorCode}`);
    }
    return;
  };

  uploadFiles: StorageService["uploadFiles"] = async (
    containerId,
    files,
    options,
  ) => {
    const containerClient = this.#client.getContainerClient(containerId);
    // oxlint-disable-next-line require-await
    const promises = files.map(async ({ content, path, mimeType }) =>
      this.#uploadFile(
        containerClient.getBlockBlobClient(path),
        content,
        mimeType,
        options.abortSignal,
      ),
    );

    await Promise.allSettled(promises);
  };

  // oxlint-disable-next-line max-params
  #uploadFile = async (
    client: BlockBlobClient,
    data: Blob | string | ReadableStream,
    mimeType: string,
    abortSignal?: AbortSignal,
  ): Promise<void> => {
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
      await client.uploadStream(
        Readable.fromWeb(stream),
        undefined,
        undefined,
        { abortSignal, blobHTTPHeaders: { blobContentType: mimeType } },
      );
      return;
    }

    throw new Error(`Unknown file type`);
  };

  hasFile: StorageService["hasFile"] = async (
    containerId,
    filepath,
    options,
  ) => {
    const containerClient = this.#client.getContainerClient(containerId);
    const blockBlobClient = containerClient.getBlockBlobClient(filepath);
    return await blockBlobClient.exists({ abortSignal: options.abortSignal });
  };

  downloadFile: StorageService["downloadFile"] = async (
    containerId,
    filepath,
    options,
  ) => {
    const containerClient = this.#client.getContainerClient(containerId);
    const blockBlobClient = containerClient.getBlockBlobClient(filepath);

    if (!(await blockBlobClient.exists())) {
      throw new Error(
        `File '${filepath}' not found in container '${containerId}'.`,
      );
    }

    const downloadResponse = await blockBlobClient.download(0, undefined, {
      abortSignal: options.abortSignal,
    });

    if (!downloadResponse.readableStreamBody) {
      throw new Error(
        `File '${filepath}' in container '${containerId}' is not downloadable.`,
      );
    }

    return {
      content: downloadResponse.readableStreamBody as unknown as ReadableStream,
      mimeType: downloadResponse.contentType,
      path: filepath,
    };
  };
}
