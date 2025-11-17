import { Buffer } from "node:buffer";
import * as S3 from "@aws-sdk/client-s3";
import type { StorageAdapter } from "@storybooker/adapter/storage";

export class AwsS3StorageService implements StorageAdapter {
  #client: S3.S3Client;

  constructor(client: S3.S3Client) {
    this.#client = client;
  }

  createContainer: StorageAdapter["createContainer"] = async (
    containerId,
    options,
  ) => {
    await this.#client.send(
      new S3.CreateBucketCommand({
        Bucket: genBucketNameFromContainerId(containerId),
      }),
      { abortSignal: options.abortSignal },
    );
  };

  deleteContainer: StorageAdapter["deleteContainer"] = async (
    containerId,
    options,
  ) => {
    await this.#client.send(
      new S3.DeleteBucketCommand({
        Bucket: genBucketNameFromContainerId(containerId),
      }),
      { abortSignal: options.abortSignal },
    );
  };

  hasContainer: StorageAdapter["hasContainer"] = async (
    containerId,
    options,
  ) => {
    const buckets = await this.#client.send(new S3.ListBucketsCommand({}), {
      abortSignal: options.abortSignal,
    });
    return !!buckets.Buckets?.some(
      (bucket) => bucket.Name === genBucketNameFromContainerId(containerId),
    );
  };

  listContainers: StorageAdapter["listContainers"] = async (options) => {
    const buckets = await this.#client.send(new S3.ListBucketsCommand({}), {
      abortSignal: options.abortSignal,
    });
    // oxlint-disable-next-line no-non-null-assertion
    return buckets.Buckets?.map((bucket) => bucket.Name!) ?? [];
  };

  deleteFiles: StorageAdapter["deleteFiles"] = async (
    containerId,
    filePathsOrPrefix,
    options,
  ) => {
    const bucket = genBucketNameFromContainerId(containerId);
    let objects: { Key: string }[] = [];
    if (typeof filePathsOrPrefix === "string") {
      const resp = await this.#client.send(
        new S3.ListObjectsV2Command({
          Bucket: bucket,
          Prefix: filePathsOrPrefix,
        }),
        { abortSignal: options.abortSignal },
      );
      // oxlint-disable-next-line no-non-null-assertion
      objects = (resp.Contents ?? []).map((obj) => ({ Key: obj.Key! }));
    } else {
      objects = filePathsOrPrefix.map((path) => ({ Key: path }));
    }
    if (objects.length === 0) {
      return;
    }

    await this.#client.send(
      new S3.DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: objects },
      }),
      { abortSignal: options.abortSignal },
    );
  };

  uploadFiles: StorageAdapter["uploadFiles"] = async (
    containerId,
    files,
    options,
  ) => {
    const bucket = genBucketNameFromContainerId(containerId);

    const promises = files.map(
      async ({ content, path, mimeType }) =>
        await this.#client.send(
          new S3.PutObjectCommand({
            Body: typeof content === "string" ? Buffer.from(content) : content,
            Bucket: bucket,
            ContentType: mimeType,
            Key: path,
          }),
          { abortSignal: options.abortSignal },
        ),
    );

    await Promise.allSettled(promises);
  };

  hasFile: StorageAdapter["hasFile"] = async (
    containerId,
    filepath,
    options,
  ) => {
    try {
      await this.#client.send(
        new S3.HeadObjectCommand({
          Bucket: genBucketNameFromContainerId(containerId),
          Key: filepath,
        }),
        { abortSignal: options.abortSignal },
      );
      return true;
    } catch {
      return false;
    }
  };

  downloadFile: StorageAdapter["downloadFile"] = async (
    containerId,
    filepath,
    options,
  ) => {
    const bucket = genBucketNameFromContainerId(containerId);
    const resp = await this.#client.send(
      new S3.GetObjectCommand({ Bucket: bucket, Key: filepath }),
      { abortSignal: options.abortSignal },
    );
    if (!resp.Body) {
      throw new Error(`File '${filepath}' not found.`);
    }
    return {
      content: resp.Body as ReadableStream,
      mimeType: resp.ContentType,
      path: filepath,
    };
  };
}

function genBucketNameFromContainerId(containerId: string): string {
  return containerId
    .replaceAll(/[^\w-]+/g, "-")
    .slice(0, 63)
    .toLowerCase();
}
