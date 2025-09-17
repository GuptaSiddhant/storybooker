import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from "@azure/functions";
import {
  createRequestHandler,
  generatePrefixFromBaseRoute,
  parseErrorMessage,
  SERVICE_NAME,
  urlJoin,
  type AuthService,
  type DatabaseService,
  type LoggerService,
  type OpenAPIOptions,
  type StorageService,
} from "@storybooker/core";
import type { BodyInit } from "undici";
import { parseAzureRestError } from "./error-parser";

// const DEFAULT_PURGE_SCHEDULE_CRON = "0 0 0 * * *";

export type { OpenAPIOptions } from "@storybooker/core";

/**
 * Options to register the storybooker router
 */
export interface RegisterStorybookerRouterOptions {
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
  auth?: AuthService;

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
}

export function registerStoryBookerRouter(
  options: RegisterStorybookerRouterOptions,
): void {
  const route = options.route || "";
  // oxlint-disable-next-line no-console
  console.log("Registering Storybooker Router (route: %s)", route || "/");

  app.setup({ enableHttpStream: true });

  const handlerOptions: ServiceHandlerOptions = {
    auth: options.auth,
    baseRoute: route,
    database: options.database,
    headless: options.headless,
    logger: options.logger,
    staticDirs: options.staticDirs,
    storage: options.storage,
  };

  app.http(SERVICE_NAME, {
    authLevel: options.authLevel,
    handler: serviceHandler.bind(null, handlerOptions),
    methods: [
      "DELETE",
      "GET",
      "HEAD",
      "OPTIONS",
      "PATCH",
      "POST",
      "PUT",
      "TRACE",
    ],
    route: urlJoin(route, "{**path}"),
  });

  // if (options.purgeScheduleCron !== null) {
  //   app.timer(`${SERVICE_NAME}-timer_purge`, {
  //     handler: wrapTimerHandlerWithStore(routerOptions, timerPurgeHandler),
  //     runOnStartup: false,
  //     schedule: options.purgeScheduleCron || DEFAULT_PURGE_SCHEDULE_CRON,
  //   });
  // }
}

interface ServiceHandlerOptions {
  auth?: AuthService;
  baseRoute: string;
  headless?: boolean;
  logger?: LoggerService;
  staticDirs: readonly string[] | undefined;
  database: DatabaseService;
  storage: StorageService;
}

async function serviceHandler(
  options: ServiceHandlerOptions,
  httpRequest: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const requestHandler = createRequestHandler({
    auth: options.auth,
    customErrorParser: parseAzureRestError,
    database: options.database,
    headless: options.headless,
    logger: options.logger || context,
    prefix: generatePrefixFromBaseRoute(options.baseRoute) || "/",
    staticDirs: options.staticDirs,
    storage: options.storage,
  });

  try {
    const request = new Request(httpRequest.url, {
      // oxlint-disable-next-line no-invalid-fetch-options
      body: httpRequest.body as ReadableStream | null,
      // @ts-expect-error - Duplex is required for streaming but not supported in TS
      duplex: "half",
      headers: new Headers(httpRequest.headers as Headers),
      method: httpRequest.method,
    });

    const response = await requestHandler(request);

    return {
      body: response.body as BodyInit | null,
      headers: new Headers(response.headers),
      status: response.status,
    };
  } catch (error) {
    const { errorMessage, errorType } = parseErrorMessage(error);
    context.error(errorType, errorMessage);
    return {
      body: errorMessage,
      headers: { "Content-Type": "text/plain" },
      status: 500,
    };
  }
}
