import type { MiddlewareHandler } from "hono";
import type { AuthAdapter, StoryBookerUser } from "./adapters/_internal/auth.ts";
import type { DatabaseAdapter } from "./adapters/_internal/database.ts";
import type { LoggerAdapter } from "./adapters/_internal/logger.ts";
import type { StorageAdapter } from "./adapters/_internal/storage.ts";
import type { UIAdapter } from "./adapters/_internal/ui.ts";
import type { WebhookCreateType } from "./models/webhooks-schema.ts";
import type { ErrorParser } from "./utils/error.ts";

export type {
  StoryBookerUser,
  StoryBookerPermissionAction,
  StoryBookerPermissionKey,
  StoryBookerPermissionResource,
  StoryBookerPermissionWithKey,
} from "./adapters/_internal/auth.ts";
export type {
  BuildCreateType,
  BuildStoryType,
  BuildType,
  BuildUpdateType,
  BuildUploadVariant,
  BuildsGetResultType,
  BuildsListResultType,
} from "./models/builds-schema.ts";
export type {
  ProjectCreateType,
  ProjectGetResultType,
  ProjectUpdateType,
  ProjectType,
  ProjectsListResultType,
} from "./models/projects-schema.ts";
export type {
  TagCreateType,
  TagType,
  TagUpdateType,
  TagVariant,
  TagsGetResultType,
  TagsListResultType,
} from "./models/tags-schema.ts";
export type { ErrorParser, ParsedError } from "./utils/error.ts";
export type { UrlBuilder } from "./urls.ts";
export type {
  WebhookEvent,
  WebhookType,
  WebhookCreateType,
  WebhookUpdateType,
} from "./models/webhooks-schema.ts";

/**
 * Options for creating a router.
 */
export interface RouterOptions<User extends StoryBookerUser> {
  /** Adapter for Auth service. Provides authentication to the service. */
  auth?: AuthAdapter<User>;
  /** Adapter for Database service. Provides access to storing data to the service. */
  database: DatabaseAdapter;
  /** Additional options to configure the router. */
  config?: RouterConfig;
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
export interface RouterConfig {
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
   * Convey URL prefix to the service if the router is not hosted on the root.
   */
  prefix?: string;
  /**
   * Enable queueing of zip file processing for files larger than the maximum inline upload processing size.
   * Requires QueueAdapter and other setup.
   * @default false
   */
  queueLargeZipFileProcessing?: boolean;
  /**
   * Add Hono middlewares to the router before any endpoint is registered/invoked.
   */
  middlewares?: MiddlewareHandler[];
  /**
   * SECRET key used for encrypting sensitive values stored in database.
   * E.g. webhook headers.
   *
   * If not provided, sensitive values will be stored in plain text.
   */
  secret?: string;
  /**
   * Pre-configured webhooks to use for dispatching events (all projects).
   */
  webhooks?: WebhookCreateType[];
}
