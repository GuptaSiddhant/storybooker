import type { RestError } from "@azure/core-rest-pipeline";
import type {
  HttpFunctionOptions,
  HttpRequest,
  HttpResponseInit,
  SetupOptions,
  TimerFunctionOptions,
} from "@azure/functions";
import { createPurgeHandler, createRequestHandler } from "@storybooker/core";
import { SERVICE_NAME } from "@storybooker/core/constants";
import type {
  ErrorParser,
  RequestHandlerOptions,
  StoryBookerUser,
} from "@storybooker/core/types";
import { generatePrefixFromBaseRoute, urlJoin } from "@storybooker/core/utils";
import type { BodyInit } from "undici";

const DEFAULT_PURGE_SCHEDULE_CRON = "0 0 0 * * *";

export type * from "@storybooker/core/types";

interface FunctionsApp {
  http(name: string, options: HttpFunctionOptions): void;
  setup(options: SetupOptions): void;
  timer(name: string, options: TimerFunctionOptions): void;
}

/**
 * Options to register the storybooker router
 */
export interface RegisterStorybookerRouterOptions<User extends StoryBookerUser>
  extends Omit<RequestHandlerOptions<User>, "abortSignal" | "prefix"> {
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
}

export function registerStoryBookerRouter<User extends StoryBookerUser>(
  app: FunctionsApp,
  options: RegisterStorybookerRouterOptions<User>,
): void {
  app.setup({ enableHttpStream: true });

  const route = options.route || "";
  const logger = options.logger ?? console;
  const requestHandler = createRequestHandler({
    ...options,
    errorParser: options.errorParser ?? parseAzureRestError,
    logger,
    prefix: generatePrefixFromBaseRoute(route) || "/",
  });

  logger.log("Registering Storybooker Router (route: %s)", route || "/");
  app.http(SERVICE_NAME, {
    authLevel: options.authLevel,
    handler: async (httpRequest, context) => {
      const request = transformHttpRequestToWebRequest(httpRequest);
      const response = await requestHandler(request, {
        logger: options.logger ?? context,
      });
      return transformWebResponseToHttpResponse(response);
    },
    methods: ["DELETE", "GET", "PATCH", "POST", "PUT"],
    route: urlJoin(route, "{**path}"),
  });

  if (options.purgeScheduleCron !== null) {
    const schedule = options.purgeScheduleCron || DEFAULT_PURGE_SCHEDULE_CRON;
    const purgeHandler = createPurgeHandler({
      database: options.database,
      errorParser: options.errorParser ?? parseAzureRestError,
      logger,
      storage: options.storage,
    });

    logger.log("Registering Storybooker Timer-Purge (cron: %s)", schedule);
    app.timer(`${SERVICE_NAME}-timer_purge`, {
      // oxlint-disable-next-line require-await
      handler: async (_timer, context) => purgeHandler({}, { logger: context }),
      runOnStartup: false,
      schedule,
    });
  }
}

const parseAzureRestError: ErrorParser = (error) => {
  if (error instanceof Error && error.name === "RestError") {
    const restError = error as RestError;
    const details = (restError.details ?? {}) as Record<string, string>;
    const message: string = details["errorMessage"] ?? restError.message;

    return {
      errorMessage: `${details["errorCode"] ?? restError.name} (${
        restError.code ?? restError.statusCode
      }): ${message}`,
      errorStatus: restError.statusCode,
      errorType: "AzureRest",
    };
  }

  return;
};

function transformHttpRequestToWebRequest(httpRequest: HttpRequest): Request {
  return new Request(httpRequest.url, {
    // oxlint-disable-next-line no-invalid-fetch-options
    body: httpRequest.body as ReadableStream | null,
    // @ts-expect-error - Duplex is required for streaming but not supported in TS
    duplex: "half",
    headers: new Headers(httpRequest.headers as Headers),
    method: httpRequest.method,
  });
}

function transformWebResponseToHttpResponse(
  response: Response,
): HttpResponseInit {
  return {
    body: response.body as BodyInit | null,
    headers: new Headers(response.headers),
    status: response.status,
  };
}
