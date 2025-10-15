import type { LoggerService } from ".";

/**
 * Service adapter to interact with file-storage.
 *
 * @description
 * The adapter should provide callbacks to perform operations
 * to an existing storage like upload and download files.
 *
 * - `container`: A container/group/bucket to hold files. Each project has one container.
 * - `file`: A single binary that can individually stored and retrieved.
 */
export interface StorageService {
  /**
   * An optional method that is called on app boot-up
   * to run async setup functions.
   * @param options Common options like abortSignal.
   * @throws if an error occur during initialisation.
   */
  init?: (options: StorageServiceOptions) => Promise<void>;

  // Containers

  /**
   * List all containers available in the storage.
   * @param options Common options like abortSignal.
   * @returns A list of names/IDs of the containers.
   * @throws If the Storage service is not connected.
   */
  listContainers: (options: StorageServiceOptions) => Promise<string[]>;

  /**
   * Create a container used for different projects.
   * @param containerId ID of the container
   * @param options Common options like abortSignal.
   * @throws if container with ID already exists.
   */
  createContainer: (
    containerId: string,
    options: StorageServiceOptions,
  ) => Promise<void>;

  /**
   * Delete an existing container.
   * @param containerId ID of the container
   * @param options Common options like abortSignal.
   * @throws if container with ID does not exist.
   */
  deleteContainer: (
    containerId: string,
    options: StorageServiceOptions,
  ) => Promise<void>;

  /**
   * Check if container exists.
   * @param containerId ID of the container
   * @param options Common options like abortSignal.
   * @returns if container is available of not
   * @throws never.
   */
  hasContainer: (
    containerId: string,
    options: StorageServiceOptions,
  ) => Promise<boolean>;

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
    options: StorageServiceOptions,
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
    options: StorageServiceOptions,
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
    options: StorageServiceOptions,
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
    options: StorageServiceOptions,
  ) => Promise<Partial<StoryBookerFile>>;
}

/** Common Storage service options.  */
export interface StorageServiceOptions {
  /** A signal that can be used to cancel the request handling. */
  abortSignal?: AbortSignal;
  /** Logger */
  logger: LoggerService;
}

/** Shape of file/blob */
export interface StoryBookerFile {
  content: Blob | ReadableStream | string;
  mimeType: string;
  path: string;
}
