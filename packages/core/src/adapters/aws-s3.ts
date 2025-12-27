import {
  type S3Client,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Buffer } from "node:buffer";
import { StorageAdapterErrors, type StorageAdapter } from "./_internal/storage.ts";

/**
 * AWS S3 implementation of the StorageAdapter interface.
 *
 * @classdesc
 * Provides file storage operations for StoryBooker using AWS S3 as the backend.
 * Supports bucket and object management with automatic error handling.
 *
 * @example
 * ```ts
 * import { S3Client } from "@aws-sdk/client-s3";
 * import { AwsS3StorageService } from "storybooker/aws-s3";
 *
 * // Create S3 client
 * const client = new S3Client({ region: "us-east-1" });
 * // Initialize the storage adapter
 * const storage = new AwsS3StorageService(client);
 * // Use the storage adapter with StoryBooker
 * const router = createHonoRouter({ storage });
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/s3/ | AWS S3 Documentation}
 */
export class AwsS3StorageService implements StorageAdapter {
  #client: S3Client;

  /**
   * Creates a new AWS S3 storage adapter instance.
   *
   * @param client - The authenticated S3Client instance for connecting to AWS S3
   *
   * @example
   * ```ts
   * import { S3Client } from "@aws-sdk/client-s3";
   * const client = new S3Client({ region: "us-east-1" });
   * const storage = new AwsS3StorageService(client);
   * ```
   */
  constructor(client: S3Client) {
    this.#client = client;
  }

  get metadata(): StorageAdapter["metadata"] {
    return {
      name: "AWS S3",
      description: "Object storage using AWS S3 buckets.",
      version: this.#client.config.apiVersion,
    };
  }

  createContainer: StorageAdapter["createContainer"] = async (containerId, options) => {
    try {
      await this.#client.send(
        new CreateBucketCommand({ Bucket: genBucketNameFromContainerId(containerId) }),
        { abortSignal: options.abortSignal },
      );
    } catch (error) {
      throw new StorageAdapterErrors.ContainerAlreadyExistsError(containerId, error);
    }
  };

  deleteContainer: StorageAdapter["deleteContainer"] = async (containerId, options) => {
    try {
      await this.#client.send(
        new DeleteBucketCommand({ Bucket: genBucketNameFromContainerId(containerId) }),
        { abortSignal: options.abortSignal },
      );
    } catch (error) {
      throw new StorageAdapterErrors.ContainerDoesNotExistError(containerId, error);
    }
  };

  hasContainer: StorageAdapter["hasContainer"] = async (containerId, options) => {
    const buckets = await this.#client.send(new ListBucketsCommand({}), {
      abortSignal: options.abortSignal,
    });
    return Boolean(
      buckets.Buckets?.some((bucket) => bucket.Name === genBucketNameFromContainerId(containerId)),
    );
  };

  listContainers: StorageAdapter["listContainers"] = async (options) => {
    const buckets = await this.#client.send(new ListBucketsCommand({}), {
      abortSignal: options.abortSignal,
    });
    // oxlint-disable-next-line no-non-null-assertion
    return buckets.Buckets?.map((bucket) => bucket.Name!) ?? [];
  };

  deleteFiles: StorageAdapter["deleteFiles"] = async (containerId, filePathsOrPrefix, options) => {
    try {
      const bucket = genBucketNameFromContainerId(containerId);
      let objects: { Key: string }[] = [];
      if (typeof filePathsOrPrefix === "string") {
        const resp = await this.#client.send(
          new ListObjectsV2Command({
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
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects },
        }),
        { abortSignal: options.abortSignal },
      );
    } catch (error) {
      throw new StorageAdapterErrors.CustomError(
        undefined,
        `Failed to delete files in container ${containerId}.`,
        error,
      );
    }
  };

  uploadFiles: StorageAdapter["uploadFiles"] = async (containerId, files, options) => {
    const bucket = genBucketNameFromContainerId(containerId);

    const promises = files.map(async ({ content, path, mimeType }) => {
      await this.#client
        .send(
          new PutObjectCommand({
            Body: typeof content === "string" ? Buffer.from(content) : content,
            Bucket: bucket,
            ContentType: mimeType,
            Key: path,
          }),
          { abortSignal: options.abortSignal },
        )
        .then((error: unknown) => {
          options.logger.error(`Failed to upload file ${path} to bucket ${bucket}:`, error);
        });
    });

    await Promise.allSettled(promises);
  };

  hasFile: StorageAdapter["hasFile"] = async (containerId, filepath, options) => {
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

  downloadFile: StorageAdapter["downloadFile"] = async (containerId, filepath, options) => {
    const bucket = genBucketNameFromContainerId(containerId);
    const resp = await this.#client.send(new GetObjectCommand({ Bucket: bucket, Key: filepath }), {
      abortSignal: options.abortSignal,
    });

    if (!resp.Body) {
      throw new StorageAdapterErrors.FileDoesNotExistError(containerId, filepath);
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
