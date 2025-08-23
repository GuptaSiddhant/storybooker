import type {
  HttpRequest,
  HttpResponse,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

/**
 * Options to register the storybooker router
 */
export type RegisterStorybookerRouterOptions = {
  /**
   * Name of the service. @default "storybooker"
   */
  serviceName?: string;

  /**
   * Define the route on which all router is placed.
   * Can be a sub-path of the main API route.
   *
   * @default ''
   */
  route?: string;

  /**
   * Set the Azure Functions authentication level for all routes.
   *
   * This is a good option to set if the service is used in
   * Headless mode and requires single token authentication
   * for all the requests.
   *
   * This setting does not affect health-check route.
   */
  authLevel?: "admin" | "function" | "anonymous";

  /**
   * Name of the Environment variable which stores
   * the connection string to the Azure Storage resource.
   * @default 'AzureWebJobsStorage'
   */
  storageConnectionStringEnvVar?: string;

  /**
   * Modify the cron-schedule of timer function
   * which purge outdated storybooks.
   *
   * Pass `null` to disable auto-purge functionality.
   *
   * @default "0 0 0 * * *" // Every midnight
   */
  purgeScheduleCron?: string | null;

  /**
   * Options to configure OpenAPI schema
   */
  openapi?: OpenAPIOptions;

  /**
   * Directories to serve static files from relative to project root (package.json)
   * @default './public'
   */
  staticDirs?: string[];

  /**
   * Callback function to check permissions. The function receives following params
   * @param permission - object containing resource and action to permit
   * @param context - Invocation context of Azure Function
   * @param request - the HTTP request object
   *
   * @return `true` to allow access, or following to deny:
   * - `false` - returns 403 response
   * - `HttpResponse` - returns the specified HTTP response
   */
  checkPermissions?: CheckPermissionsCallback;
};

export interface OpenAPIOptions {
  /**
   * Enable or disable openAPI schema endpoint.
   * @default false
   */
  disabled?: boolean;
  /**
   * Title of the OpenAPI schema
   * @default SERVICE_NAME (storybooks)
   */
  title?: string;
  /**
   * A version visible in the OpenAPI schema.
   * @default process.env['NODE_ENV']
   */
  version?: string;
  /**
   * Servers to be included in the OpenAPI schema.
   */
  servers?: Array<{
    url: string;
    description?: string;
    variables?: Record<
      string,
      {
        enum?: string[] | boolean[] | number[];
        default: string | boolean | number;
        description?: string;
      }
    >;
  }>;
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
  request: HttpRequest,
  context: InvocationContext
) =>
  | boolean
  | HttpResponse
  | HttpResponseInit
  | Promise<boolean | HttpResponse | HttpResponseInit>;
/**
 * Type of permission to check
 */
export type Permission = {
  resource: PermissionResource;
  action: PermissionAction;
  projectId?: string;
};
/**
 * Type of possible resources to check permissions for
 */
export type PermissionResource =
  | "project"
  | "build"
  | "label"
  | "openapi"
  | "ui";
/**
 * Type of possible actions to check permissions for
 */
export type PermissionAction = "create" | "read" | "update" | "delete";
