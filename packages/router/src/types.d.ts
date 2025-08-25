export interface Logger {
  error: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  debug?: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  trace?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
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
  request: Request,
) => boolean | Response | Promise<boolean | Response>;

/**  Type of permission to check */
export type Permission = `${PermissionResource}:${PermissionAction}`;

/** Type of possible resources to check permissions for */
export type PermissionResource =
  | "project"
  | "build"
  | "label"
  | "openapi"
  | "ui";

/** Type of possible actions to check permissions for */
export type PermissionAction = "create" | "read" | "update" | "delete";
