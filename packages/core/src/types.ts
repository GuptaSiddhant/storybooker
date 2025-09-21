import type { AuthService, StoryBookerUser } from "./services/auth";
import type { DatabaseService } from "./services/database";
import type { StorageService } from "./services/storage";
import type { Translation } from "./translations";

export type * from "./services/auth";
export type * from "./services/database";
export type * from "./services/storage";

/**
 * Options for creating a request handler.
 */
export interface RequestHandlerOptions<User extends StoryBookerUser> {
  /** Adapter for Auth service. Provides authentication to the service. */
  auth?: AuthService<User>;
  /** Adapter for Database service. Provides access to storing data to the service. */
  database: DatabaseService;
  /**
   * A function for parsing custom errors.
   * Return `undefined` from parser if the service should handle the error.
   */
  errorParser?: ErrorParser;
  /** Adapter for Logging service. Provides option to direct the logging of the service. */
  logger?: LoggerService;
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
  storage: StorageService;
  /** Options to customise StoryBooker UI. */
  ui?: UIOptions;
}

export type RequestHandler = (
  request: Request,
  overrideOptions?: RequestHandlerOverrideOptions,
) => Promise<Response>;

export interface RequestHandlerOverrideOptions {
  /** A abort signal that can be used to cancel the request handling. */
  abortSignal?: AbortSignal;
  /** Adapter for Logging service. Provides option to direct the logging of the service. */
  logger?: LoggerService;
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

  /**
   * Which UI to load when OpenAPI endpoint is requested from browsers.
   * @default swagger
   */
  ui?: "swagger" | "scalar";
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
  };
  textColor: {
    primary: string;
    secondary: string;
    accent: string;
    invert: string;
  };
  borderColor: {
    default: string;
  };
}
