import type { Readable } from "node:stream";

export interface Logger {
  error: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  debug?: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  trace?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
}

export interface DatabaseDocumentListOptions<Item extends { id: string }> {
  limit?: number;
  filter?: string | ((item: Item) => boolean);
  select?: string[];
  sort?: "latest" | ((item1: Item, item2: Item) => number);
}
export interface DatabaseService {
  listCollections: () => Promise<string[]>;
  createCollection: (name: string) => Promise<void>;
  deleteCollection: (name: string) => Promise<void>;

  listDocuments: <Item extends { id: string }>(
    collectionName: string,
    options?: DatabaseDocumentListOptions<Item>,
  ) => Promise<Item[]>;
  createDocument: <Item extends { id: string }>(
    collectionName: string,
    document: Item,
  ) => Promise<void>;
  getDocument: <Item extends { id: string }>(
    collectionName: string,
    id: string,
    partitionKey?: string,
  ) => Promise<Item>;
  updateDocument: <Item extends { id: string }>(
    collectionName: string,
    id: string,
    document: Partial<Omit<Item, "id">>,
    partitionKey?: string,
  ) => Promise<void>;
  deleteDocument: (
    collectionName: string,
    id: string,
    partitionKey?: string,
  ) => Promise<void>;
}

export interface StorageService {
  listContainers: () => Promise<string[]>;
  createContainer: (name: string) => Promise<void>;
  deleteContainer: (name: string) => Promise<void>;

  uploadFile: (
    containerName: string,
    file: Blob | string | Readable,
    options: { mimeType: string; destinationPath: string },
  ) => Promise<void>;
  uploadDir: (
    containerName: string,
    dirpath: string,
    fileOptions?: (filepath: string) => {
      newFilepath: string;
      mimeType: string;
    },
  ) => Promise<void>;
  deleteFile: (containerName: string, destinationPath: string) => Promise<void>;
  deleteFiles: (containerName: string, prefix: string) => Promise<void>;
  downloadFile: (containerName: string, filepath: string) => Promise<Response>;
}

export interface OpenAPIOptions {
  /**
   * Servers to be included in the OpenAPI schema.
   */
  servers?: {
    url: string;
    description?: string;
    variables?: Record<
      string,
      { enum?: [string, ...string[]]; default: string; description?: string }
    >;
  }[];

  /**
   * Which UI to load when OpenAPI endpoint is requested from browsers.
   * @default swagger
   */
  ui?: "swagger" | "scalar";
}

/**
 * Type for the callback function to check permissions.
 *
 * Return true to allow access, or following to deny:
 * - false - returns 403 response
 * - HttpResponse - returns the specified HTTP response
 */
export type CheckPermissionsCallback = (
  permissions: Permission[],
  options: { request: Request; logger: Logger },
) => boolean | Response | Promise<boolean | Response>;

/**  Type of permission to check */
export interface Permission {
  action: PermissionAction;
  projectId: string | undefined;
  resource: PermissionResource;
}

/** Type of possible resources to check permissions for */
export type PermissionResource = "project" | "build" | "label" | "openapi";

/** Type of possible actions to check permissions for */
export type PermissionAction = "create" | "read" | "update" | "delete";
