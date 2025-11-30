import type { MiddlewareHandler } from "hono";
import type {
  AuthAdapter,
  DatabaseAdapter,
  LoggerAdapter,
  StorageAdapter,
  StoryBookerUser,
  UIAdapter,
} from "./adapters";

export type { StoryBookerUser } from "./adapters/auth";
export type * from "./models/builds-schema";
export type * from "./models/projects-schema";
export type * from "./models/tags-schema";

/**
 * Options for creating a request handler.
 */
export interface RouterOptions<User extends StoryBookerUser> {
  /** Adapter for Auth service. Provides authentication to the service. */
  auth?: AuthAdapter<User>;
  /** Adapter for Database service. Provides access to storing data to the service. */
  database: DatabaseAdapter;
  /** Additional options to configure the router. */
  config?: RequestHandlerConfigOptions;
  /** Adapter for Logging service. Provides option to direct the logging of the service. */
  logger?: LoggerAdapter;
  /** Adapter for Storage service. Provides access to storing files to the service. */
  storage: StorageAdapter;
  /** Options to customise StoryBooker UI. */
  ui?: UIAdapter;
}

/**
 * Options for creating a purge handler.
 */
export interface PurgeHandlerOptions {
  /** Adapter for Database service. Provides access to storing data to the service. */
  database: DatabaseAdapter;
  /**
   * A function for parsing custom errors.
   * Return `undefined` from parser if the service should handle the error.
   */
  errorParser?: ErrorParser;
  /** Adapter for Logging service. Provides option to direct the logging of the service. */
  logger?: LoggerAdapter;
  /** Adapter for Storage service. Provides access to storing files to the service. */
  storage: StorageAdapter;
}

/** Additional options to configure the router. */
export interface RequestHandlerConfigOptions {
  /**
   * A function for parsing custom errors.
   * Return `undefined` from parser if the service should handle the error.
   */
  errorParser?: ErrorParser;
  /**
   * Maximum upload size in bytes for processing zip files while uploading.
   * @default "5 * 1024 * 1024" (5MB)
   */
  maxInlineUploadProcessingSizeInBytes?: number;
  /**
   * Enable queueing of zip file processing for files larger than the maximum inline upload processing size.
   * Requires QueueAdapter and other setup.
   * @default false
   */
  queueLargeZipFileProcessing?: boolean;
  /**
   * Convey URL prefix to the service if the router is not hosted on the root.
   */
  prefix?: string;
  /**
   * Add Hono middlewares to the router before any endpoint is registered/invoked.
   */
  middlewares?: MiddlewareHandler[];
}

/** Function generated to handle the incoming requests. */
export type RequestHandler = (
  request: Request,
  overrideOptions?: RequestHandlerOverrideOptions,
) => Promise<Response>;

/** Options to override properties of the request handler. */
export interface RequestHandlerOverrideOptions {
  /** A abort signal that can be used to cancel the request handling. */
  abortSignal?: AbortSignal;
  /** Adapter for Logging service. Provides option to direct the logging of the service. */
  logger?: LoggerAdapter;
}

/**
 * A function type for parsing custom errors.
 * Return `undefined` from parser if the service should handle the error.
 */
export type ErrorParser = (error: unknown) => ParsedError | undefined;
export interface ParsedError {
  errorMessage: string;
  errorStatus?: number;
  errorType: string;
}
