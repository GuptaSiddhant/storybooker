// oxlint-disable max-lines-per-function

import { DEFAULT_LOCALE, HEADERS } from "#constants";
import { localStore } from "#store";
import { parseErrorMessage } from "#utils/error";
import { createMiddlewaresPipelineRequestHandler } from "#utils/middleware-utils";
import { handleStaticFileRoute } from "./root/handlers";
import { router } from "./router";
import { translations_enGB } from "./translations/en-gb";
import type {
  AuthService,
  RequestHandler,
  RequestHandlerOptions,
  StoryBookerUser,
} from "./types";

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
    options.auth?.init?.({}).catch(logger.error),
    options.database.init?.({}).catch(logger.error),
    options.storage.init?.({}).catch(logger.error),
  ]);

  const requestHandler: RequestHandler = async (request, overrideOptions) => {
    // Make sure initialisations are complete before first request is handled.
    await initPromises;

    try {
      const locale =
        request.headers.get(HEADERS.acceptLanguage)?.split(",").at(0) ||
        DEFAULT_LOCALE;
      const user = await options.auth?.getUserDetails(request, {
        abortSignal: overrideOptions?.abortSignal,
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
