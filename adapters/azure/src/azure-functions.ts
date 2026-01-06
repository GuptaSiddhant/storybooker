// oxlint-disable max-lines-per-function

import type { RestError } from "@azure/core-rest-pipeline";
import type {
  Cookie,
  HttpFunctionOptions,
  HttpRequest,
  HttpResponseInit,
  HttpTriggerOptions,
  InvocationContext,
  SetupOptions,
  TimerFunctionOptions,
} from "@azure/functions";
import { createHonoRouter, createPurgeHandler } from "storybooker";
import type { AuthAdapter } from "storybooker//adapter/auth";
import type { LoggerAdapter } from "storybooker//adapter/logger";
import type { ErrorParser, RouterOptions, StoryBookerUser } from "storybooker//types";
import { generatePrefixFromBaseRoute, SERVICE_NAME, urlJoin } from "storybooker//utils";

const DEFAULT_PURGE_SCHEDULE_CRON = "0 0 0 * * *";

/**
 * Minimal representation of Azure Functions App namespace
 * to register HTTP and Timer functions.
 */
interface FunctionsApp {
  http(name: string, options: HttpFunctionOptions): void;
  setup?(options: SetupOptions): void;
  timer?(name: string, options: TimerFunctionOptions): void;
}

/**
 * Options to register the storybooker router
 */
export interface RegisterStorybookerRouterOptions<User extends StoryBookerUser> extends Omit<
  RouterOptions<User>,
  "auth"
> {
  /**
   * For authenticating routes, either use an AuthAdapter or Functions auth-level property.
   *
   * - AuthAdapter allows full customization of authentication logic. This will set the function to "anonymous" auth-level.
   * - Auth-level is a simpler way to set predefined authentication levels ("function", "admin").
   *   This is a good option to set if the service is used in
   *   Headless mode and requires single token authentication for all the requests.
   *
   * @see https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=python-v2%2Cisolated-process%2Cnodejs-v4%2Cfunctionsv2&pivots=programming-language-javascript#http-auth (AuthLevels)
   */
  auth?: AuthAdapter<User> | Exclude<HttpTriggerOptions["authLevel"], "anonymous">;

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

/**
 * Register the Storybooker router with the Azure Functions App.
 *
 * - It enabled streaming responses for HTTP functions.
 * - It registers the HTTP function with provided route and auth-level.
 * - It registers the Timer function for purge if `purgeScheduleCron` is not `null`.
 *
 * @param app Azure Functions App instance
 * @param options Options for registering the router
 */
export function registerStoryBookerRouter<User extends StoryBookerUser>(
  app: FunctionsApp,
  options: RegisterStorybookerRouterOptions<User>,
): void {
  app.setup?.({ enableHttpStream: true });
  const { auth, purgeScheduleCron, route, ...rest } = options;

  const routerOptions: RouterOptions<User> = rest;
  routerOptions.config ??= {};
  routerOptions.config.errorParser ??= parseAzureRestError;

  if (route) {
    routerOptions.config.prefix = generatePrefixFromBaseRoute(route);
  }
  if (typeof auth === "object") {
    routerOptions.auth = auth;
  }

  const router = createHonoRouter(routerOptions);

  app.http(SERVICE_NAME, {
    authLevel: typeof auth === "string" ? auth : "anonymous",
    handler: async (httpRequest) => {
      const request = newRequestFromAzureFunctions(httpRequest);
      const response = await router.fetch(request);
      return newAzureFunctionsResponse(response);
    },
    methods: ["GET", "POST", "DELETE", "HEAD", "PATCH", "PUT", "OPTIONS", "TRACE", "CONNECT"],
    route: urlJoin(route ?? "", "{**path}"),
  });

  if (purgeScheduleCron !== null && app.timer) {
    const schedule = purgeScheduleCron ?? DEFAULT_PURGE_SCHEDULE_CRON;
    const purgeHandler = createPurgeHandler({
      database: routerOptions.database,
      storage: routerOptions.storage,
    });

    app.timer(`${SERVICE_NAME}-timer_purge`, {
      // oxlint-disable-next-line require-await
      handler: async (_timer, context) =>
        purgeHandler({}, { logger: createAzureContextLogger(context) }),
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

  // oxlint-disable-next-line no-useless-return
  return;
};

function createAzureContextLogger(context: InvocationContext): LoggerAdapter {
  return {
    debug: context.debug.bind(context),
    error: context.error.bind(context),
    log: context.log.bind(context),
    metadata: {
      data: { functionName: context.functionName },
      description: "Azure Insights Logger using Azure Functions context.",
      id: context.invocationId,
      name: "Azure Functions",
    },
  };
}

/**
 * Utils (@refer https://github.com/Marplex/hono-azurefunc-adapter/)
 */

/** */
function newRequestFromAzureFunctions(request: HttpRequest): Request {
  const hasBody = !["GET", "HEAD"].includes(request.method);

  return new Request(request.url, {
    headers: headersToObject(request.headers),
    method: request.method,
    ...(hasBody ? { body: request.body as unknown as ReadableStream, duplex: "half" } : {}),
  });
}

function newAzureFunctionsResponse(response: Response): HttpResponseInit {
  let headers = headersToObject(response.headers);
  let cookies = cookiesFromHeaders(response.headers);

  return {
    body: streamToAsyncIterator(response.body),
    cookies,
    headers,
    status: response.status,
  };
}

function headersToObject(input: HttpRequest["headers"]): Record<string, string> {
  const headers: Record<string, string> = {};
  // oxlint-disable-next-line no-array-for-each
  input.forEach((value, key) => (headers[key] = value));
  return headers;
}

function cookiesFromHeaders(headers: Headers): Cookie[] | undefined {
  const cookies = headers.getSetCookie();
  if (cookies.length === 0) {
    return undefined;
  }

  return cookies.map((cookie) => parseCookieString(cookie));
}

function parseCookieString(cookieString: string): Cookie {
  const [first, ...attributesArray] = cookieString
    .split(";")
    .map((item) => item.split("="))
    .map(([key, value]) => [key?.trim().toLowerCase(), value ?? "true"]);

  const [name, encodedValue] = first ?? [];
  const attrs = Object.fromEntries(attributesArray) as Record<string, string>;

  return {
    domain: attrs["domain"],
    expires: attrs["expires"] ? new Date(attrs["expires"]) : undefined,
    httpOnly: attrs["httponly"] === "true",
    maxAge: attrs["max-age"] ? Number.parseInt(attrs["max-age"], 10) : undefined,
    name: name ?? "",
    path: attrs["path"],
    sameSite: attrs["samesite"] as "Strict" | "Lax" | "None" | undefined,
    secure: attrs["secure"] === "true",
    value: encodedValue ? decodeURIComponent(encodedValue) : "",
  };
}

function streamToAsyncIterator(
  readable: Response["body"],
): AsyncIterableIterator<Uint8Array> | null {
  if (readable === null || !readable) {
    return null;
  }

  const reader = readable.getReader();
  return {
    async next() {
      return await reader.read();
    },
    return() {
      reader.releaseLock();
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  } as AsyncIterableIterator<Uint8Array>;
}
