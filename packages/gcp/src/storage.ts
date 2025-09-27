import { Readable } from "node:stream";
import type streamWeb from "node:stream/web";
import type { File, Storage } from "@google-cloud/storage";
import type { StorageService } from "@storybooker/core/types";

export class GcpGcsStorageService implements StorageService {
  #client: Storage;

  constructor(client: Storage) {
    this.#client = client;
  }

  createContainer: StorageService["createContainer"] = async (
    containerId,
    _options,
  ) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    await this.#client.createBucket(bucketName, {});
  };

  deleteContainer: StorageService["deleteContainer"] = async (
    containerId,
    _options,
  ) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    await this.#client.bucket(bucketName).delete();
  };

  hasContainer: StorageService["hasContainer"] = async (
    containerId,
    _options,
  ) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    const [exists] = await this.#client.bucket(bucketName).exists();
    return exists;
  };

  listContainers: StorageService["listContainers"] = async (_options) => {
    const [buckets] = await this.#client.getBuckets();
    return buckets.map((bucket) => bucket.name);
  };

  deleteFiles: StorageService["deleteFiles"] = async (
    containerId,
    filePathsOrPrefix,
    _options,
  ) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    const bucket = this.#client.bucket(bucketName);

    if (typeof filePathsOrPrefix === "string") {
      // Delete all files with the prefix
      await bucket.deleteFiles({ prefix: filePathsOrPrefix });
    } else {
      // Delete specific files
      await Promise.all(
        filePathsOrPrefix.map(
          async (filepath) =>
            await bucket.file(filepath).delete({ ignoreNotFound: true }),
        ),
      );
    }
  };

  uploadFiles: StorageService["uploadFiles"] = async (
    containerId,
    files,
    _options,
  ) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    const bucket = this.#client.bucket(bucketName);

    await Promise.allSettled(
      files.map(async ({ content, path, mimeType }) => {
        await uploadFileToGcs(bucket.file(path), content, mimeType);
      }),
    );
  };

  hasFile: StorageService["hasFile"] = async (
    containerId,
    filepath,
    _options,
  ) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    const file = this.#client.bucket(bucketName).file(filepath);
    const [exists] = await file.exists();
    return exists;
  };

  downloadFile: StorageService["downloadFile"] = async (
    containerId,
    filepath,
    _options,
  ) => {
    const bucketName = genBucketNameFromContainerId(containerId);
    const file = this.#client.bucket(bucketName).file(filepath);

    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(
        `File '${filepath}' not found in bucket '${containerId}'.`,
      );
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
    data instanceof ReadableStream
      ? Readable.fromWeb(data as streamWeb.ReadableStream)
      : data;

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
