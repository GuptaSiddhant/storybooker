import { type BlobClient, BlobServiceClient } from "@azure/storage-blob";
import type { StorageService } from "@storybooker/router/types";
import { Readable } from "node:stream";
import fs from "node:fs";
import path from "node:path";

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

    // oxlint-disable-next-line prefer-template
    throw new Error("Unknown file type: " + file);
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
}
