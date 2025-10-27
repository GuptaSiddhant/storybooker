// oxlint-disable max-lines-per-function

import * as accountRoutes from "./account/routes";
import * as buildsRoutes from "./builds/routes";
import { handlePurge, type HandlePurge } from "./handlers/handle-purge";
import { handleStaticFileRoute } from "./handlers/handle-static-file-route";
import * as projectsRoutes from "./projects/routes";
import * as rootRoutes from "./root/routes";
import * as tagsRoutes from "./tags/routes";
import { translations_enGB } from "./translations/en-gb";
import type {
  AuthService,
  PurgeHandlerOptions,
  RequestHandler,
  RequestHandlerOptions,
  StoryBookerUser,
} from "./types";
import { DEFAULT_LOCALE, HEADERS } from "./utils/constants";
import { parseErrorMessage } from "./utils/error";
import { createMiddlewaresPipelineRequestHandler } from "./utils/middleware-utils";
import { router } from "./utils/router-utils";
import { localStore } from "./utils/store";

if ("setEncoding" in process.stdout) {
  process.stdout.setEncoding("utf8");
}

router.registerGroup(rootRoutes);
router.registerGroup(projectsRoutes);
router.registerGroup(tagsRoutes);
router.registerGroup(buildsRoutes);
router.registerGroup(accountRoutes);

export { router };
export { SERVICE_NAME } from "./utils/constants";

export type {
  OpenAPIOptions,
  RequestHandler,
  RequestHandlerOptions,
  RequestHandlerOverrideOptions,
  StoryBookerUser,
  UIOptions,
} from "./types";

/**
 * Callback to create a request-handler based on provided options.
 * @param options Options for creating a request handler.
 * @returns The request-handler which accepts Web-standard Request and return a standard Response.
 */
export function createRequestHandler<User extends StoryBookerUser>(
  options: RequestHandlerOptions<User>,
): RequestHandler {
  const logger = options.logger || console;
  const initPromises = Promise.allSettled([
    options.auth?.init?.({ logger }).catch(logger.error),
    options.database.init?.({ logger }).catch(logger.error),
    options.storage.init?.({ logger }).catch(logger.error),
  ]);

  const requestHandler: RequestHandler = async (request, overrideOptions) => {
    // Make sure initialisations are complete before first request is handled.
    await initPromises;

    try {
      const locale =
        request.headers.get(HEADERS.acceptLanguage)?.split(",").at(0) ||
        DEFAULT_LOCALE;
      const user = await options.auth?.getUserDetails({
        abortSignal: overrideOptions?.abortSignal,
        logger: overrideOptions?.logger ?? logger,
        request: request.clone(),
      });

      localStore.enterWith({
        ...options,
        abortSignal: overrideOptions?.abortSignal ?? request.signal,
        auth: options.auth as AuthService | undefined,
        locale,
        logger: overrideOptions?.logger ?? logger,
        prefix: options.prefix || "",
        request,
        translation: options.ui?.translation ?? translations_enGB,
        url: request.url,
        user,
      });

      const response = await router.handleRequest();
      if (response) {
        return response;
      }

      return await handleStaticFileRoute(options.staticDirs);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }

      const { errorMessage } = parseErrorMessage(error, options.errorParser);
      return new Response(errorMessage, { status: 500 });
    }
  };

  if (options.middlewares && options.middlewares.length > 0) {
    return createMiddlewaresPipelineRequestHandler(
      options.middlewares,
      requestHandler,
    );
  }

  return requestHandler;
}

/**
 * Callback to create a purge-handler based on provided options.
 * Purging deletes all builds older than certain days based on Project's configuration.
 *
 * Note: The latest build on project's default branch is not deleted.
 */
export function createPurgeHandler(options: PurgeHandlerOptions): HandlePurge {
  const logger = options.logger || console;
  const initPromises = Promise.allSettled([
    options.database.init?.({ logger }).catch(logger.error),
    options.storage.init?.({ logger }).catch(logger.error),
  ]);

  return async (...params: Parameters<HandlePurge>) => {
    // Make sure initialisations are complete before first request is handled.
    await initPromises;

    try {
      localStore.enterWith({
        abortSignal: params[1].abortSignal,
        database: options.database,
        errorParser: options.errorParser,
        locale: DEFAULT_LOCALE,
        logger: params[1]?.logger ?? logger,
        prefix: "/",
        request: new Request(""),
        storage: options.storage,
        translation: translations_enGB,
        url: "/",
        user: null,
      });

      await handlePurge(...params);
    } catch (error) {
      logger.error(parseErrorMessage(error, options.errorParser).errorMessage);
    }
  };
}
