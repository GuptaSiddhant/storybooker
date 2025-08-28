import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { BlobServiceClient, type BlobClient } from "@azure/storage-blob";
import type { StorageService } from "@storybooker/router";

export class AzureStorage implements StorageService {
  #client: BlobServiceClient;

  constructor(connectionString: string) {
    this.#client = BlobServiceClient.fromConnectionString(connectionString);
  }

  createContainer: StorageService["createContainer"] = async (name) => {
    await this.#client.createContainer(name);
  };

  deleteContainer: StorageService["deleteContainer"] = async (name) => {
    await this.#client.getContainerClient(name).deleteIfExists();
  };

  listContainers: StorageService["listContainers"] = async () => {
    const containers: string[] = [];
    for await (const item of this.#client.listContainers()) {
      containers.push(item.name);
    }

    return containers;
  };

  deleteFile: StorageService["deleteFile"] = async (name, path) => {
    await this.#client.getContainerClient(name).deleteBlob(path);
  };

  deleteFiles: StorageService["deleteFiles"] = async (name, prefix) => {
    const containerClient = this.#client.getContainerClient(name);
    const blobClientsToDelete: BlobClient[] = [];
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobClientsToDelete.push(containerClient.getBlobClient(blob.name));
    }

    if (blobClientsToDelete.length === 0) {
      return;
    }

    const response = await containerClient
      .getBlobBatchClient()
      .deleteBlobs(blobClientsToDelete);

    if (response.errorCode) {
      throw new Error(`Failed to delete blobs: ${response.errorCode}`);
    }
    return;
  };

  uploadFile: StorageService["uploadFile"] = async (
    containerName,
    file,
    options,
  ) => {
    const { destinationPath, mimeType = "application/octet-stream" } = options;
    const client = this.#client
      .getContainerClient(containerName)
      .getBlockBlobClient(destinationPath);

    if (typeof file === "string") {
      await client.uploadFile(file, {
        blobHTTPHeaders: {
          blobContentType: mimeType,
        },
      });
      return;
    }
    if (file instanceof Blob) {
      await client.uploadData(file, {
        blobHTTPHeaders: {
          blobContentType: mimeType,
        },
      });
      return;
    }
    if (file instanceof Readable) {
      await client.uploadStream(file, undefined, undefined, {
        blobHTTPHeaders: {
          blobContentType: mimeType,
        },
      });
      return;
    }

    throw new Error(`Unknown file type`);
  };

  uploadDir: StorageService["uploadDir"] = async (
    containerName,
    dirpath,
    fileOptions,
  ) => {
    const containerClient = this.#client.getContainerClient(containerName);

    const files = fs
      .readdirSync(dirpath, {
        recursive: true,
        withFileTypes: true,
      })
      .filter((file) => file.isFile() && !file.name.startsWith("."))
      .map((file) => path.join(file.parentPath, file.name));

    // context.info(`Found ${files.length} files in dir to upload: ${dirpath}.`);
    const uploadErrors = new Map<string, unknown>();

    for (const filepath of files) {
      if (!fs.existsSync(filepath)) {
        // context.warn(`File ${filepath} does not exist, skipping.`);
        continue;
      }

      const blobName = filepath.replace(`${dirpath}/`, "");

      try {
        const { mimeType, newFilepath: updatedBlobName } = fileOptions?.(
          blobName,
        ) || {
          mimeType: "application/octet-stream",
          newFilepath: blobName,
        };

        // context.debug(`Uploading '${filepath}' to '${newFilepath}'...`);
        // oxlint-disable-next-line no-await-in-loop
        const response = await containerClient
          .getBlockBlobClient(updatedBlobName)
          .uploadFile(filepath, {
            blobHTTPHeaders: { blobContentType: mimeType },
          });

        if (response.errorCode) {
          throw response.errorCode;
        }
      } catch (error) {
        // context.error(
        //   `Failed to upload blob '${blobName}'. Error: ${errorMessage}`,
        // );
        uploadErrors.set(blobName, error);
      }
    }

    if (uploadErrors.size > 0) {
      throw new Error(
        `Failed to upload ${uploadErrors.size} files to container: ${containerClient.containerName}.`,
      );
    }

    return;
  };

  downloadFile = async (
    containerName: string,
    filepath: string,
  ): Promise<Response> => {
    const containerClient = this.#client.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(filepath);

    if (!(await blockBlobClient.exists())) {
      return new Response(
        `File '${filepath}' not found in container '${containerName}'.`,
        { status: 404 },
      );
    }

    const downloadResponse = await blockBlobClient.download(0);

    if (!downloadResponse.readableStreamBody) {
      return new Response(
        `File '${filepath}' in container '${containerName}' is not downloadable.`,
        { status: 415 },
      );
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      downloadResponse.contentType || "application/octet-stream",
    );
    if (downloadResponse.contentLength) {
      headers.set("Content-Length", downloadResponse.contentLength.toString());
    }
    if (downloadResponse.contentEncoding) {
      headers.set("Content-Encoding", downloadResponse.contentEncoding);
    }

    const stream =
      downloadResponse.readableStreamBody as unknown as ReadableStream;
    return new Response(stream, { headers, status: 200 });
  };
}
