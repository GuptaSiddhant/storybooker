import type { File, Storage } from "@google-cloud/storage";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import type streamWeb from "node:stream/web";
import { StorageAdapterErrors, type StorageAdapter } from "./_internal/storage.ts";

/**
 * Google Cloud Storage implementation of the StorageAdapter interface.
 *
 * @classdesc
 * Provides file storage operations for StoryBooker using Google Cloud Storage as the backend.
 * Supports bucket and object management with automatic error handling.
 *
 * @example
 * ```ts
 * import { Storage } from "@google-cloud/storage";
 * import { GcpGcsStorageService } from "storybooker/gcp-storage";
 *
 * // Create Cloud Storage client
 * const client = new Storage({ projectId: "my-project" });
 * // Initialize the storage adapter
 * const storage = new GcpGcsStorageService(client);
 * // Use the storage adapter with StoryBooker
 * const router = createHonoRouter({ storage });
 * ```
 *
 * @see {@link https://cloud.google.com/storage/docs | Google Cloud Storage Documentation}
 */
export class GcpGcsStorageService implements StorageAdapter {
  #client: Storage;

  /**
   * Creates a new Google Cloud Storage adapter instance.
   *
   * @param client - The authenticated Storage client instance for connecting to Google Cloud Storage
   *
   * @example
   * ```ts
   * import { Storage } from "@google-cloud/storage";
   * const client = new Storage({ projectId: "my-project" });
   * const storage = new GcpGcsStorageService(client);
   * ```
   */
  constructor(client: Storage) {
    this.#client = client;
  }

  get metadata(): StorageAdapter["metadata"] {
    return {
      name: "Google Cloud Storage",
      description: "Object storage using Google Cloud Storage buckets.",
      id: this.#client.projectId,
      url: this.#client.apiEndpoint,
    };
  }

  createContainer: StorageAdapter["createContainer"] = async (containerId, _options) => {
    try {
      const bucketName = genBucketNameFromContainerId(containerId);
      await this.#client.createBucket(bucketName, {});
    } catch (error) {
      throw new StorageAdapterErrors.ContainerAlreadyExistsError(containerId, error);
    }
  };

  deleteContainer: StorageAdapter["deleteContainer"] = async (containerId, _options) => {
    try {
      const bucketName = genBucketNameFromContainerId(containerId);
      await this.#client.bucket(bucketName).delete();
    } catch (error) {
      throw new StorageAdapterErrors.ContainerDoesNotExistError(containerId, error);
    }
  };

  hasContainer: StorageAdapter["hasContainer"] = async (containerId, _options) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    const [exists] = await this.#client.bucket(bucketName).exists();
    return exists;
  };

  listContainers: StorageAdapter["listContainers"] = async (_options) => {
    const [buckets] = await this.#client.getBuckets();
    return buckets.map((bucket) => bucket.name);
  };

  deleteFiles: StorageAdapter["deleteFiles"] = async (containerId, filePathsOrPrefix, _options) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    const bucket = this.#client.bucket(bucketName);

    if (typeof filePathsOrPrefix === "string") {
      // Delete all files with the prefix
      await bucket.deleteFiles({ prefix: filePathsOrPrefix });
    } else {
      // Delete specific files
      await Promise.all(
        filePathsOrPrefix.map(
          async (filepath) => await bucket.file(filepath).delete({ ignoreNotFound: true }),
        ),
      );
    }
  };

  uploadFiles: StorageAdapter["uploadFiles"] = async (containerId, files, _options) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    const bucket = this.#client.bucket(bucketName);

    await Promise.allSettled(
      files.map(async ({ content, path, mimeType }) => {
        await uploadFileToGcs(bucket.file(path), content, mimeType);
      }),
    );
  };

  hasFile: StorageAdapter["hasFile"] = async (containerId, filepath, _options) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    const file = this.#client.bucket(bucketName).file(filepath);
    const [exists] = await file.exists();
    return exists;
  };

  downloadFile: StorageAdapter["downloadFile"] = async (containerId, filepath, _options) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    const file = this.#client.bucket(bucketName).file(filepath);

    const [exists] = await file.exists();
    if (!exists) {
      throw new StorageAdapterErrors.FileDoesNotExistError(containerId, filepath);
    }

    const [metadata] = await file.getMetadata();
    const mimeType = metadata.contentType;

    const readable = file.createReadStream();
    const content = Readable.toWeb(readable);

    return {
      content: content as ReadableStream,
      mimeType,
      path: filepath,
    };
  };
}

function genBucketNameFromContainerId(containerId: string): string {
  // GCS bucket names: lowercase, numbers, dashes, dots, 3-63 chars
  return containerId
    .replaceAll(/[^\w.-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 63);
}

async function uploadFileToGcs(
  file: File,
  data: Blob | string | ReadableStream,
  mimeType: string,
): Promise<void> {
  if (typeof data === "string" || data instanceof Buffer) {
    await file.save(data, { contentType: mimeType });
    return;
  }

  if (data instanceof Blob) {
    const buffer = Buffer.from(await data.arrayBuffer());
    await file.save(buffer, { contentType: mimeType });
    return;
  }

  const readable =
    data instanceof ReadableStream ? Readable.fromWeb(data as streamWeb.ReadableStream) : data;

  if (readable instanceof Readable) {
    // Node.js Readable stream
    await new Promise<void>((resolve, reject) => {
      const writeStream = file.createWriteStream({ contentType: mimeType });
      readable.pipe(writeStream).on("finish", resolve).on("error", reject);
    });
    return;
  }

  throw new Error(`Unknown file type`);
}
