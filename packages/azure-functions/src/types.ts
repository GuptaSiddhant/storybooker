import type {
  AuthService,
  BrandingOptions,
  DatabaseService,
  LoggerService,
  Middleware,
  OpenAPIOptions,
  StorageService,
  StoryBookerUser,
} from "@storybooker/core/types";

/**
 * Options to register the storybooker router
 */
export interface RegisterStorybookerRouterOptions<
  User extends StoryBookerUser,
> {
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
   * Branding options
   */
  branding?: BrandingOptions;

  /**
   * Enable headless mode to disable all UI/HTML responses
   */
  headless?: boolean;

  /**
   * Define the route on which all router is placed.
   * Can be a sub-path of the main API route.
   *
   * @default ''
   */
  route?: string;

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
   * Options to configure OpenAPI schema.
   * Set it to null, to disable OpenAPI schema generation.
   */
  openAPI?: OpenAPIOptions | null;

  /**
   * Directories to serve static files from relative to project root (package.json)
   * @default './public'
   */
  readonly staticDirs?: string[];

  /**
   * Provide an adapter for a supported Auth service, like Azure EasyAuth.
   */
  auth?: AuthService<User>;

  /**
   * Provide an adapter for a supported Database service, like Azure DataTables or CosmosDB.
   */
  database: DatabaseService;

  /**
   * Provide an adapter for a supported Storage service, like Azure BlobStorage.
   */
  storage: StorageService;

  /**
   * Provide an adapter for a logging service to override the default.
   */
  logger?: LoggerService;

  /**
   * Run middleware to modify incoming Request or outgoing Response. You can only call next(request) once per middleware. Calling it multiple times will throw an error.
   */
  middlewares?: Middleware[];
}
