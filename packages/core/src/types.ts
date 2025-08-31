/**
 * Service to log to desired destination.
 *
 * The service should contain method to `log` and report `error`.
 * It can optionally have `debug` callback for debug messages.
 *
 * @default NodeJS.console
 */
export interface LoggerService {
  error: (...args: unknown[]) => void;
  debug?: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
}

export interface DatabaseDocumentListOptions<Item extends { id: string }> {
  limit?: number;
  filter?: string | ((item: Item) => boolean);
  select?: string[];
  sort?: "latest" | ((item1: Item, item2: Item) => number);
}
/**
 * Service to interact with database.
 *
 * The service should callbacks to CRUD operations
 * to an existing database.
 */
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

/**
 * Service to interact with file-storage.
 *
 * The service should callbacks to perform operations
 * to an existing storage like upload and download files.
 */
export interface StorageService {
  listContainers: () => Promise<string[]>;
  createContainer: (name: string) => Promise<void>;
  deleteContainer: (name: string) => Promise<void>;

  uploadFile: (
    containerName: string,
    file: Blob | string | ReadableStream,
    options: { mimeType: string; destinationPath: string },
  ) => Promise<void>;
  uploadDir: (
    containerName: string,
    dirpath: string,
    destPrefix: string | undefined,
  ) => Promise<void>;
  deleteFile: (containerName: string, destinationPath: string) => Promise<void>;
  deleteFiles: (containerName: string, prefix: string) => Promise<void>;
  downloadFile: (
    containerName: string,
    filepath: string,
  ) => Promise<ReadableStream | string>;
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
 * Service to manage authentication.
 *
 * The service is responsible to authorise users from
 * accessing the app.
 */
export interface AuthService<AuthUser extends User = User> {
  /**
   * This callback is called before every protected route and determines if user
   * has access to the route. It receives a permission object.
   *
   * - Response with `true` to allow user to proceed.
   * - Respond with `false` to block user.
   * - Resposd with `Response` to return custom response
   */
  authorise: AuthServiceAuthorize<AuthUser>;
  /**
   * Get details about the user based on incoming request.
   *
   * Throw an error or response (redirect-to-login) if it is a unauthenticated/anauthorised request.
   */
  getUserDetails: (request: Request) => Promise<AuthUser>;
  /**
   * Give user to logout from UI. The returning response should clear auth session.
   */
  logout?: (user: AuthUser, request: Request) => Promise<Response>;
}

/**
 * Type for the callback function to check permissions.
 *
 * Return true to allow access, or following to deny:
 * - false - returns 403 response
 * - Response - returns the specified HTTP response
 */
export type AuthServiceAuthorize<AuthUser extends User> = (
  permission: Permission,
  options: { request: Request; user: AuthUser },
) => Promise<boolean | Response>;

/**  Type of permission to check */
export interface Permission {
  action: PermissionAction;
  projectId: string | undefined;
  resource: PermissionResource;
}

/** Type of possible resources to check permissions for */
export type PermissionResource =
  | "project"
  | "build"
  | "label"
  | "openapi"
  | "ui";

/** Type of possible actions to check permissions for */
export type PermissionAction = "create" | "read" | "update" | "delete";

export interface User {
  id: string;
  displayName: string;
  imageUrl?: string;
  title?: string;
}
