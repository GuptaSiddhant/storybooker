// oxlint-disable max-classes-per-file

import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
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
 *
 * @throws {StorageNotInitializedError} if the Storage service is not connected.
 * @throws {ContainerAlreadyExistsError} if the container already exists.
 * @throws {ContainerDoesNotExistError} if the container does not exist.
 * @throws {FileDoesNotExistError} if the file does not exist in the container.
 */
export interface StorageAdapter {
  /**
   * Metadata about the adapter.
   */
  get metadata(): { name: string };

  /**
   * An optional method that is called on app boot-up
   * to run async setup functions.
   * @param options Common options like abortSignal.
   * @throws If the Storage service fails to initialize.
   */
  init?: (options: StorageAdapterOptions) => Promise<void>;

  // Containers

  /**
   * List all containers available in the storage.
   * @param options Common options like abortSignal.
   * @returns A list of names/IDs of the containers.
   * @throws {StorageNotInitializedError} if the Storage service is not connected.
   */
  listContainers: (options: StorageAdapterOptions) => Promise<string[]>;

  /**
   * Create a container used for different projects.
   * @param containerId ID of the container
   * @param options Common options like abortSignal.
   * @throws if container with ID already exists.
   */
  createContainer: (containerId: string, options: StorageAdapterOptions) => Promise<void>;

  /**
   * Delete an existing container.
   * @param containerId ID of the container
   * @param options Common options like abortSignal.
   * @throws if container with ID does not exist.
   */
  deleteContainer: (containerId: string, options: StorageAdapterOptions) => Promise<void>;

  /**
   * Check if container exists.
   * @param containerId ID of the container
   * @param options Common options like abortSignal.
   * @returns if container is available of not
   * @throws never.
   */
  hasContainer: (containerId: string, options: StorageAdapterOptions) => Promise<boolean>;

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
 * Pre-defined Storage adapter errors
 * that can be used across different adapters.
 *
 * Throws {HTTPException} with relevant status codes.
 */
export const StorageAdapterErrors = {
  StorageNotInitializedError: class extends HTTPException {
    constructor(cause?: unknown) {
      super(500, { cause, message: "Storage adapter is not initialized." });
    }
  },
  ContainerAlreadyExistsError: class extends HTTPException {
    constructor(containerId: string, cause?: unknown) {
      super(409, {
        cause,
        message: `Storage container '${containerId}' already exists.`,
      });
    }
  },
  ContainerDoesNotExistError: class extends HTTPException {
    constructor(containerId: string, cause?: unknown) {
      super(404, {
        cause,
        message: `Storage container '${containerId}' does not exist.`,
      });
    }
  },
  FileDoesNotExistError: class extends HTTPException {
    constructor(containerId: string, filepath: string, cause?: unknown) {
      super(404, {
        cause,
        message: `Storage file '${filepath}' does not exist in container '${containerId}'.`,
      });
    }
  },
  FileMalformedError: class extends HTTPException {
    constructor(containerId: string, filepath: string, cause?: unknown) {
      super(415, {
        cause,
        message: `Storage file '${filepath}' is malformed in container '${containerId}'.`,
      });
    }
  },
  CustomError: class extends HTTPException {
    constructor(status: number | undefined, message: string, cause?: unknown) {
      super(status as ContentfulStatusCode, { cause, message });
    }
  },
  // oxlint-disable-next-line no-explicit-any
} satisfies Record<string, new (...args: any[]) => HTTPException>;
