import { OpenAPIHono } from "@hono/zod-openapi";
import { SuperHeaders } from "@remix-run/headers";
import type { Hono } from "hono";
import { logger as loggerMiddleware } from "hono/logger";
import type { AuthAdapter, StoryBookerUser } from "./adapters";
import { handlePurge, type HandlePurge } from "./handlers/handle-purge";
import { appRouter } from "./routers/_app-router";
import type { PurgeHandlerOptions, RouterOptions } from "./types";
import { DEFAULT_LOCALE } from "./utils/constants";
import { parseErrorMessage } from "./utils/error";
import { localStore } from "./utils/store";

if ("setEncoding" in process.stdout) {
  process.stdout.setEncoding("utf8");
}

/**
 * Callback to create a Hono App based on provided options.
 * @param options Options for creating a request handler.
 * @returns The Hono App which can be used wherever Hono is supported.
 */
export function createHonoRouter<User extends StoryBookerUser>(
  options: RouterOptions<User>,
): Hono {
  const logger = options.logger || console;
  const middlewares = options.config?.middlewares || [loggerMiddleware()];
  const initPromises = Promise.allSettled([
    options.auth?.init?.({ logger }).catch(logger.error),
    options.database.init?.({ logger }).catch(logger.error),
    options.storage.init?.({ logger }).catch(logger.error),
  ]);

  return new OpenAPIHono({ strict: false })
    .use(...middlewares)
    .use(async (ctx, next) => {
      await initPromises;
      const request = ctx.req.raw;
      const headers = new SuperHeaders(request.headers);
      const locale = headers.acceptLanguage.languages[0] || DEFAULT_LOCALE;
      const user = await options.auth?.getUserDetails({
        logger,
        request: request.clone(),
      });
      localStore.enterWith({
        ...options,
        abortSignal: request.signal,
        auth: options.auth as AuthAdapter | undefined,
        headers,
        locale,
        logger,
        prefix: options.config?.prefix || "",
        request,
        url: request.url,
        user,
      });
      await next();
    })
    .route("/", appRouter)
    .onError((err) => {
      if ("getResponse" in err) {
        return err.getResponse();
      }

      return new Response(err.message, { status: 500 });
    });
}

/**
 * Callback to create a purge-handler based on provided options.
 * Purging deletes all builds older than certain days based on Project's configuration.
 *
 * Note: The latest build on project's default branch is not deleted.
 */
export function createPurgeHandler(options: PurgeHandlerOptions): HandlePurge {
  const logger = options.logger || console;

  return async (...params: Parameters<HandlePurge>): Promise<void> => {
    localStore.enterWith({
      abortSignal: params[1].abortSignal,
      database: options.database,
      errorParser: options.errorParser,
      headers: new SuperHeaders(),
      locale: DEFAULT_LOCALE,
      logger: params[1]?.logger ?? logger,
      prefix: "/",
      request: new Request(""),
      storage: options.storage,
      url: "http://0.0.0.0/",
      user: null,
    });

    try {
      await handlePurge(...params);
      return;
    } catch (error) {
      logger.error(parseErrorMessage(error, options.errorParser).errorMessage);
    }
  };
}
