// oxlint-disable max-lines-per-function

import * as buildsRoutes from "#builds/routes";
import { DEFAULT_LOCALE, HEADERS } from "#constants";
import * as labelsRoutes from "#labels/routes";
import * as projectsRoutes from "#projects/routes";
import { localStore } from "#store";
import { parseErrorMessage } from "#utils/error";
import { handleStaticFileRoute } from "./root/handlers";
import * as openapiRoutes from "./root/openapi";
import * as rootRoutes from "./root/routes";
import * as serveRoutes from "./root/serve";
import { router } from "./router";
import { translations_enGB } from "./translations/en-gb";
import type {
  AuthService,
  Middleware,
  RequestHandlerOptions,
  RequestHandlerOverrideOptions,
  StoryBookerUser,
} from "./types";

export type {
  RequestHandlerOptions,
  RequestHandlerOverrideOptions,
  StoryBookerUser,
  OpenAPIOptions,
} from "./types";

export type RequestHandler = (
  request: Request,
  overrideOptions?: RequestHandlerOverrideOptions,
) => Promise<Response>;

router.registerGroup(rootRoutes);
router.registerGroup(openapiRoutes);
router.registerGroup(serveRoutes);
router.registerGroup(projectsRoutes);
router.registerGroup(labelsRoutes);
router.registerGroup(buildsRoutes);

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
        abortSignal: overrideOptions?.abortSignal,
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

function createMiddlewaresPipelineRequestHandler(
  middlewares: Middleware[],
  handler: RequestHandler,
): RequestHandler {
  return async function run(
    request: Request,
    overrideOptions?: RequestHandlerOverrideOptions,
  ): Promise<Response> {
    // recursive dispatcher
    async function dispatch(
      index: number,
      currentRequest: Request,
    ): Promise<Response> {
      const middleware = middlewares[index];

      if (middleware) {
        return await middleware(currentRequest, (nextReq) =>
          dispatch(index + 1, nextReq),
        );
      }

      return await handler(currentRequest, overrideOptions);
    }

    return await dispatch(0, request);
  };
}
