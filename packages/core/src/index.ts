import { SuperHeaders } from "@remix-run/headers";
import { Hono } from "hono";
import { logger as loggerMiddleware } from "hono/logger";
import type { TimingVariables } from "hono/timing";
import { createConsoleLoggerAdapter, type StoryBookerUser } from "./adapters";
import { handlePurge, type HandlePurge } from "./handlers/handle-purge";
import { appRouter } from "./routers/_app-router";
import type { PurgeHandlerOptions, RouterOptions } from "./types";
import { DEFAULT_LOCALE } from "./utils/constants";
import {
  onUnhandledErrorHandler,
  parseErrorMessage,
  prettifyZodValidationErrorMiddleware,
} from "./utils/error";
import { htmxRedirectResponse } from "./utils/response";
import { localStore, setupStore } from "./utils/store";

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
): Hono<{ Variables: TimingVariables }> {
  const logger = options.logger || createConsoleLoggerAdapter();
  const middlewares = options.config?.middlewares || [];
  const initPromises = Promise.allSettled([
    options.auth?.init?.({ logger }).catch(logger.error),
    options.database.init?.({ logger }).catch(logger.error),
    options.storage.init?.({ logger }).catch(logger.error),
  ]);

  return new Hono<{ Variables: TimingVariables }>({ strict: false })
    .use(
      loggerMiddleware(logger.log),
      prettifyZodValidationErrorMiddleware(logger),
      ...middlewares,
      setupStore<User>(options, initPromises),
      htmxRedirectResponse(),
    )
    .route("/", appRouter)
    .onError(onUnhandledErrorHandler<User>(options));
}

/**
 * Callback to create a purge-handler based on provided options.
 * Purging deletes all builds older than certain days based on Project's configuration.
 *
 * Note: The latest build on project's default branch is not deleted.
 */
export function createPurgeHandler(options: PurgeHandlerOptions): HandlePurge {
  const logger = options.logger || createConsoleLoggerAdapter();

  return async (...params: Parameters<HandlePurge>): Promise<void> => {
    const dummyRequest = new Request("http://0.0.0.0/");
    localStore.enterWith({
      abortSignal: params[1].abortSignal,
      database: options.database,
      errorParser: options.errorParser,
      headers: new SuperHeaders(),
      locale: DEFAULT_LOCALE,
      logger: params[1]?.logger ?? logger,
      prefix: "/",
      request: dummyRequest,
      storage: options.storage,
      url: dummyRequest.url,
      user: null,
    });

    try {
      await handlePurge(...params);
      return;
    } catch (error) {
      logger.error("PurgeError", parseErrorMessage(error, options.errorParser).errorMessage);
    }
  };
}
