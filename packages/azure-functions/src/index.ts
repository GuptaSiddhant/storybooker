import { app } from "@azure/functions";
import { createRequestHandler } from "@storybooker/core";
import { SERVICE_NAME } from "@storybooker/core/constants";
import type { StoryBookerUser } from "@storybooker/core/types";
import { generatePrefixFromBaseRoute, urlJoin } from "@storybooker/core/utils";
import type { RegisterStorybookerRouterOptions } from "./types";
import {
  parseAzureRestError,
  transformHttpRequestToWebRequest,
  transformWebResponseToHttpResponse,
} from "./utils";

// const DEFAULT_PURGE_SCHEDULE_CRON = "0 0 0 * * *";

export type { OpenAPIOptions } from "@storybooker/core";
export type { RegisterStorybookerRouterOptions } from "./types";

app.setup({ enableHttpStream: true });

export async function registerStoryBookerRouter<User extends StoryBookerUser>(
  options: RegisterStorybookerRouterOptions<User>,
): Promise<void> {
  const route = options.route || "";
  const logger = options.logger ?? console;

  logger.log("Registering Storybooker Router (route: %s)", route || "/");

  const requestHandler = await createRequestHandler({
    auth: options.auth,
    branding: options.branding,
    database: options.database,
    errorParser: parseAzureRestError,
    logger,
    middlewares: options.middlewares,
    prefix: generatePrefixFromBaseRoute(route) || "/",
    staticDirs: options.staticDirs,
    storage: options.storage,
  });

  app.http(SERVICE_NAME, {
    authLevel: options.authLevel,
    handler: async (httpRequest, context) => {
      const request = transformHttpRequestToWebRequest(httpRequest);
      const response = await requestHandler(request, { logger: context });
      return transformWebResponseToHttpResponse(response);
    },
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
