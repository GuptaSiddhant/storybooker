import type { StoryBookerAdapterMetadata } from "../utils/adapter-utils.ts";
import type { LoggerAdapter } from "./logger";

/**
 * Service adapter to manage authentication.
 *
 * The service is responsible to authorise users from
 * accessing the app.
 */
export interface AuthAdapter<AuthUser extends StoryBookerUser = StoryBookerUser> {
  /**
   * Metadata about the adapter.
   */
  metadata: StoryBookerAdapterMetadata;

  /**
   * An optional method that is called on app boot-up
   * to run async setup functions.
   * @param options Common options like abortSignal.
   * @throws if an error occur during initialisation.
   */
  init?: (options: Omit<AuthAdapterOptions, "request">) => Promise<void>;

  /**
   * Get details about the user and permissions based on incoming request.
   *
   * @param options Common options like abortSignal.
   *
   * @throws an error or response (redirect-to-login) if it is a unauthenticated/unauthorised request.
   */
  getUserDetails: (options: AuthAdapterOptions) => Promise<AuthUser | null>;

  /**
   * Get user to login from UI. The returning response should create auth session.
   * User will be redirected automatically after function is resolved.
   *
   * @param options Common options like abortSignal.
   */
  login: (options: AuthAdapterOptions) => Promise<Response> | Response;

  /**
   * Get user to logout from UI. The returning response should clear auth session.
   * User will be redirected automatically after function is resolved.
   *
   * @param options Common options like abortSignal.
   */
  logout: (user: AuthUser, options: AuthAdapterOptions) => Promise<Response> | Response;

  /**
   * Render custom HTML in account page. Must return valid HTML string;
   *
   * @param options Common options like abortSignal.
   */
  renderAccountDetails?: (user: AuthUser, options: AuthAdapterOptions) => Promise<string> | string;
}

/**
 * Type for the callback function to check permissions.
 *
 * @param options Common options like abortSignal.
 *
 * @returns true to allow access, or following to deny:
 * - false - returns 403 response
 * - Response - returns the specified HTTP response
 */
export type AuthAdapterAuthorise<AuthUser extends StoryBookerUser = StoryBookerUser> = (
  params: {
    permission: StoryBookerPermissionWithKey;
    user: AuthUser;
  },
  options: AuthAdapterOptions,
) => Promise<boolean | Response> | boolean | Response;

/**  Type of permission to check */
export interface StoryBookerPermission {
  action: StoryBookerPermissionAction;
  projectId?: string;
  resource: StoryBookerPermissionResource;
}
/** Permission object with key */
export type StoryBookerPermissionWithKey = StoryBookerPermission & {
  key: StoryBookerPermissionKey;
};
/** Permission in a string format */
export type StoryBookerPermissionKey =
  `${StoryBookerPermissionResource}:${StoryBookerPermissionAction}`;
/** Type of possible resources to check permissions for */
export type StoryBookerPermissionResource = "project" | "build" | "tag";
/** Type of possible actions to check permissions for */
export type StoryBookerPermissionAction = "create" | "read" | "update" | "delete";

/**
 * Base representation of a generic User
 */
export interface StoryBookerUser {
  /** Name of the user displayed in UI. */
  displayName: string;
  /** Unique ID of the user. Could be email-address. */
  id: string;
  /** Static URL for User's avatar shown in UI. */
  imageUrl?: string;
  /** Title or Team-name of the User shown in UI. */
  title?: string;
  /** Permissions assigned to the user. Missing permissions are considered false. */
  permissions: Partial<Record<StoryBookerPermissionKey, boolean>>;
}

/** Common Auth adapter options.  */
export interface AuthAdapterOptions {
  /** A signal that can be used to cancel the request handling. */
  abortSignal?: AbortSignal;
  /** Incoming request (cloned) */
  request: Request;
  /** Logger */
  logger: LoggerAdapter;
}

export const StoryBookerPermissionsAllEnabled = {
  "build:create": true,
  "build:delete": true,
  "project:update": true,
  "build:read": true,
  "tag:delete": true,
  "build:update": true,
  "tag:create": true,
  "project:read": true,
  "project:create": true,
  "tag:read": true,
  "project:delete": true,
  "tag:update": true,
} satisfies Record<StoryBookerPermissionKey, true>;

export const StoryBookerPermissionsList = Object.keys(
  StoryBookerPermissionsAllEnabled,
) as StoryBookerPermissionKey[];
