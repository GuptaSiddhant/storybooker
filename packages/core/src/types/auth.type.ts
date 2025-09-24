/**
 * Service adapter to manage authentication.
 *
 * The service is responsible to authorise users from
 * accessing the app.
 */
export interface AuthService<
  AuthUser extends StoryBookerUser = StoryBookerUser,
> {
  /**
   * An optional method that is called on app boot-up
   * to run async setup functions.
   * @param options Common options like abortSignal.
   * @throws if an error occur during initialisation.
   */
  init?: (options: AuthServiceOptions) => Promise<void>;

  /**
   * This callback is called before every protected route and determines if user
   * has access to the route. It receives a permission object.
   *
   * @returns
   * - Respond with `true` to allow user to proceed.
   * - Respond with `false` to block user.
   * - Respond with `Response` to return custom response
   */
  authorise: AuthServiceAuthorise<AuthUser>;

  /**
   * Get details about the user based on incoming request.
   *
   * @param options Common options like abortSignal.
   *
   * @throws an error or response (redirect-to-login) if it is a unauthenticated/unauthorised request.
   */
  getUserDetails: (
    request: Request,
    options: AuthServiceOptions,
  ) => Promise<AuthUser | null>;

  /**
   * Get user to login from UI. The returning response should create auth session.
   * User will be redirected automatically after function is resolved.
   *
   * @param options Common options like abortSignal.
   */
  login?: (
    request: Request,
    options: AuthServiceOptions,
  ) => Promise<Response> | Response;

  /**
   * Get user to logout from UI. The returning response should clear auth session.
   * User will be redirected automatically after function is resolved.
   *
   * @param options Common options like abortSignal.
   */
  logout?: (
    request: Request,
    user: AuthUser,
    options: AuthServiceOptions,
  ) => Promise<Response> | Response;

  /**
   * Render custom HTML in account page. Must return valid HTML string;
   *
   * @param options Common options like abortSignal.
   */
  renderAccountDetails?: (
    request: Request,
    user: AuthUser,
    options: AuthServiceOptions,
  ) => Promise<string> | string;
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
export type AuthServiceAuthorise<
  AuthUser extends StoryBookerUser = StoryBookerUser,
> = (
  params: {
    permission: PermissionWithKey;
    request: Request;
    user: AuthUser;
  },
  options: AuthServiceOptions,
) => Promise<boolean | Response> | boolean | Response;

/**  Type of permission to check */
export interface Permission {
  action: PermissionAction;
  projectId: string | undefined;
  resource: PermissionResource;
}
/** Permission object with key */
export type PermissionWithKey = Permission & { key: PermissionKey };
/** Permission in a string format */
export type PermissionKey =
  `${PermissionResource}:${PermissionAction}:${string}`;
/** Type of possible resources to check permissions for */
export type PermissionResource =
  | "project"
  | "build"
  | "label"
  | "openapi"
  | "ui";
/** Type of possible actions to check permissions for */
export type PermissionAction = "create" | "read" | "update" | "delete";

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
}

/** Common Auth service options.  */
export interface AuthServiceOptions {
  /** A signal that can be used to cancel the request handling. */
  abortSignal?: AbortSignal;
}
