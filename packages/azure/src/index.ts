import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from "@azure/functions";
import { router } from "@storybooker/router";
import { SERVICE_NAME } from "@storybooker/router/constants";
import { parseErrorMessage } from "@storybooker/router/error-utils";
import type {
  CheckPermissionsCallback,
  DatabaseService,
  OpenAPIOptions,
  StorageService,
} from "@storybooker/router/types";
import {
  generatePrefixFromBaseRoute,
  urlJoin,
} from "@storybooker/router/url-utils";
import type { BodyInit } from "undici";
import { AzureTables } from "./database";
import { parseAzureRestError } from "./error-parser";
import { AzureFunctionLogger } from "./logger";
import { AzureStorage } from "./storage";

const DEFAULT_STORAGE_CONN_STR_ENV_VAR = "AzureWebJobsStorage";
// const DEFAULT_PURGE_SCHEDULE_CRON = "0 0 0 * * *";
const DEFAULT_STATIC_DIRS = ["./public"] as const;

export type {
  CheckPermissionsCallback,
  Permission,
  OpenAPIOptions,
} from "@storybooker/router/types";

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
   * Options to configure OpenAPI schema.
   * Set it to null, to disable OpenAPI schema generation.
   */
  openAPI?: OpenAPIOptions | null;

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
}

export function registerStoryBookerRouter(
  options: RegisterStorybookerRouterOptions = {},
): void {
  const route = options.route || "";
  // oxlint-disable-next-line no-console
  console.log("Registering Storybooker Router (route: %s)", route || "/");

  const { storageConnectionString } = validateRegisterOptions(options);

  app.setup({ enableHttpStream: true });

  app.http(SERVICE_NAME, {
    authLevel: options.authLevel,
    handler: serviceHandler.bind(null, {
      baseRoute: route,
      database: new AzureTables(storageConnectionString),
      headless: options.headless,
      staticDirs: options.staticDirs || DEFAULT_STATIC_DIRS,
      storage: new AzureStorage(storageConnectionString),
    }),
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

function validateRegisterOptions(options: RegisterStorybookerRouterOptions): {
  storageConnectionString: string;
} {
  const storageConnectionStringEnvVar =
    options.storageConnectionStringEnvVar || DEFAULT_STORAGE_CONN_STR_ENV_VAR;
  const storageConnectionString = process.env[storageConnectionStringEnvVar];
  if (!storageConnectionString) {
    throw new Error(
      `Missing env-var '${storageConnectionStringEnvVar}' value.
It is required to connect with Azure Storage resource.`,
    );
  }

  return { storageConnectionString };
}

async function serviceHandler(
  options: {
    baseRoute: string;
    headless?: boolean;
    staticDirs: readonly string[];
    database: DatabaseService;
    storage: StorageService;
  },
  httpRequest: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const { baseRoute, database, storage, staticDirs, headless } = options;
  const logger = new AzureFunctionLogger(context);

  try {
    const fetchRequest = new Request(httpRequest.url, {
      // oxlint-disable-next-line no-invalid-fetch-options
      body: httpRequest.body as ReadableStream | null,
      // @ts-expect-error - Duplex is required for streaming but not supported in TS
      duplex: "half",
      headers: new Headers(httpRequest.headers as Headers),
      method: httpRequest.method,
    });

    const response = await router(fetchRequest, {
      customErrorParser: parseAzureRestError,
      database,
      headless,
      logger,
      prefix: generatePrefixFromBaseRoute(baseRoute) || "/",
      staticDirs,
      storage,
    });

    return {
      body: response.body as BodyInit | null,
      headers: new Headers(response.headers),
      status: response.status,
    };
  } catch (error) {
    const { errorMessage, errorType } = parseErrorMessage(error);
    logger.error(errorType, errorMessage);
    return {
      body: errorMessage,
      headers: { "Content-Type": "text/plain" },
      status: 500,
    };
  }
}
