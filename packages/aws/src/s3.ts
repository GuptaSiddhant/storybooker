import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import type { StorageService } from "@storybooker/core/types";

export class AwsS3StorageService implements StorageService {
  #client: S3Client;

  constructor(config: S3ClientConfig) {
    this.#client = new S3Client(config);
  }

  createContainer: StorageService["createContainer"] = async (
    containerId,
    options,
  ) => {
    await this.#client.send(
      new CreateBucketCommand({
        Bucket: genBucketNameFromContainerId(containerId),
      }),
      { abortSignal: options.abortSignal },
    );
  };

  deleteContainer: StorageService["deleteContainer"] = async (
    containerId,
    options,
  ) => {
    await this.#client.send(
      new DeleteBucketCommand({
        Bucket: genBucketNameFromContainerId(containerId),
      }),
      { abortSignal: options.abortSignal },
    );
  };

  hasContainer: StorageService["hasContainer"] = async (
    containerId,
    options,
  ) => {
    const buckets = await this.#client.send(new ListBucketsCommand({}), {
      abortSignal: options.abortSignal,
    });
    return !!buckets.Buckets?.some(
      (b) => b.Name === genBucketNameFromContainerId(containerId),
    );
  };

  listContainers: StorageService["listContainers"] = async (options) => {
    const buckets = await this.#client.send(new ListBucketsCommand({}), {
      abortSignal: options.abortSignal,
    });
    return buckets.Buckets?.map((b) => b.Name!) ?? [];
  };

  deleteFiles: StorageService["deleteFiles"] = async (
    containerId,
    filePathsOrPrefix,
    options,
  ) => {
    const bucket = genBucketNameFromContainerId(containerId);
    let objects: { Key: string }[] = [];
    if (typeof filePathsOrPrefix === "string") {
      const resp = await this.#client.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: filePathsOrPrefix }),
        { abortSignal: options.abortSignal },
      );
      objects = (resp.Contents ?? []).map((obj) => ({ Key: obj.Key! }));
    } else {
      objects = filePathsOrPrefix.map((path) => ({ Key: path }));
    }
    if (objects.length === 0) {
      return;
    }

    await this.#client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: objects },
      }),
      { abortSignal: options.abortSignal },
    );
  };

  uploadFiles: StorageService["uploadFiles"] = async (
    containerId,
    files,
    options,
  ) => {
    const bucket = genBucketNameFromContainerId(containerId);
    await Promise.allSettled(
      files.map(({ content, path, mimeType }) =>
        this.#client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: path,
            Body: typeof content === "string" ? Buffer.from(content) : content,
            ContentType: mimeType,
          }),
          { abortSignal: options.abortSignal },
        ),
      ),
    );
  };

  hasFile: StorageService["hasFile"] = async (
    containerId,
    filepath,
    options,
  ) => {
    try {
      await this.#client.send(
        new HeadObjectCommand({
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

  downloadFile: StorageService["downloadFile"] = async (
    containerId,
    filepath,
    options,
  ) => {
    const bucket = genBucketNameFromContainerId(containerId);
    const resp = await this.#client.send(
      new GetObjectCommand({ Bucket: bucket, Key: filepath }),
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
    .replace(/[^\w-]+/g, "-")
    .slice(0, 63)
    .toLowerCase();
}
