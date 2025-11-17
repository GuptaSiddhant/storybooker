import type {
  AuthAdapter,
  DatabaseAdapter,
  LoggerAdapter,
  StorageAdapter,
  StoryBookerUser,
} from "@storybooker/adapter";
import type { Translation } from "./translations";

export type { StoryBookerUser } from "@storybooker/adapter/auth";

/**
 * Options for creating a request handler.
 */
export interface RequestHandlerOptions<User extends StoryBookerUser> {
  /** Adapter for Auth service. Provides authentication to the service. */
  auth?: AuthAdapter<User>;
  /** Adapter for Database service. Provides access to storing data to the service. */
  database: DatabaseAdapter;
  /**
   * A function for parsing custom errors.
   * Return `undefined` from parser if the service should handle the error.
   */
  errorParser?: ErrorParser;
  /** Additional configs */
  config?: {
    /**
     * Enable queueing of zip file processing for files larger than the maximum inline upload processing size.
     * Requires QueueAdapter and other setup.
     * @default false
     */
    queueLargeZipFileProcessing?: boolean;
    /** Maximum upload size in bytes for processing zip files while uploading.
     * @default "5 * 1024 * 1024" (5MB)
     */
    maxInlineUploadProcessingSizeInBytes?: number;
  };
  /** Adapter for Logging service. Provides option to direct the logging of the service. */
  logger?: LoggerAdapter;
  /**
   * List of middlewares that run before a request is handled.
   * Run middleware to modify incoming Request or outgoing Response.
   */
  middlewares?: Middleware[];
  /** Options to update OpenAPI spec of the service */
  openAPI?: OpenAPIOptions;
  /** Convey URL prefix to the service if the router is not hosted on the root. */
  prefix?: string;
  /**
   * List of path of directories relative to root where static media is kept.
   * @default ["./public"]
   */
  staticDirs?: readonly string[];
  /** Adapter for Storage service. Provides access to storing files to the service. */
  storage: StorageAdapter;
  /** Options to customise StoryBooker UI. */
  ui?: UIOptions;
}

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

export type RequestHandler = (
  request: Request,
  overrideOptions?: RequestHandlerOverrideOptions,
) => Promise<Response>;

export interface RequestHandlerOverrideOptions {
  /** A abort signal that can be used to cancel the request handling. */
  abortSignal?: AbortSignal;
  /** Adapter for Logging service. Provides option to direct the logging of the service. */
  logger?: LoggerAdapter;
}

/**
 * Run middleware to modify incoming Request or outgoing Response.
 * You can only call next(request) once per middleware. Calling it multiple times will throw an error.
 */
export type Middleware = (
  request: Request,
  next: (
    request: Request,
    overrideOptions?: RequestHandlerOverrideOptions,
  ) => Promise<Response>,
) => Promise<Response>;

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

/**
 * OpenAPI options
 */
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
}

export interface UIOptions {
  /** Valid HTML string to place a logo/text in Header. */ logo?: string;
  /** Dark mode theme */
  darkTheme?: BrandTheme;
  /** Light mode theme */
  lightTheme?: BrandTheme;
  /** Enable or disable response streaming. @default true */
  streaming?: boolean;
  /** Provide custom translations for the UI. Default to English-GB. */
  translation?: Translation;
}

/** Brand colors used for theming. */
export interface BrandTheme {
  backgroundColor: {
    base: string;
    card: string;
    invert: string;
    destructive: string;
  };
  textColor: {
    primary: string;
    secondary: string;
    accent: string;
    invert: string;
    destructive: string;
  };
  borderColor: {
    default: string;
  };
}
