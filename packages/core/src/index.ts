import { SuperHeaders } from "@remix-run/headers";
import type { AuthAdapter, StoryBookerUser } from "./adapters";
import { handlePurge, type HandlePurge } from "./handlers/handle-purge";
import { generateAppRouter } from "./routers/_app-router";
import type {
  PurgeHandlerOptions,
  RequestHandler,
  RequestHandlerOptions,
} from "./types";
import { DEFAULT_LOCALE } from "./utils/constants";
import { parseErrorMessage } from "./utils/error";
import { localStore } from "./utils/store";

export { SERVICE_NAME } from "./utils/constants";
export type * from "./types";

if ("setEncoding" in process.stdout) {
  process.stdout.setEncoding("utf8");
}

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
  const appRouter = generateAppRouter({
    middlewares: options.config?.middlewares,
  });

  const requestHandler: RequestHandler = async (request, overrideOptions) => {
    // Make sure initialisations are complete before first request is handled.
    await initPromises;

    try {
      const headers = new SuperHeaders(request.headers);
      const locale = headers.acceptLanguage.languages[0] || DEFAULT_LOCALE;
      const user = await options.auth?.getUserDetails({
        abortSignal: overrideOptions?.abortSignal,
        logger: overrideOptions?.logger ?? logger,
        request: request.clone(),
      });

      return await localStore.run(
        {
          ...options,
          abortSignal: overrideOptions?.abortSignal ?? request.signal,
          auth: options.auth as AuthAdapter | undefined,
          headers,
          locale,
          logger: overrideOptions?.logger ?? logger,
          prefix: options.config?.prefix || "",
          request,
          url: request.url,
          user,
        },
        async () => await appRouter.fetch(request, process.env),
      );
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }

      const { errorMessage, errorStatus = 500 } = parseErrorMessage(
        error,
        options.config?.errorParser,
      );
      return new Response(errorMessage, { status: errorStatus });
    }
  };

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
      return await localStore.run(
        {
          abortSignal: params[1].abortSignal,
          database: options.database,
          errorParser: options.errorParser,
          headers: new SuperHeaders(),
          locale: DEFAULT_LOCALE,
          logger: params[1]?.logger ?? logger,
          prefix: "/",
          request: new Request(""),
          storage: options.storage,
          url: "/",
          user: null,
        },
        () => handlePurge(...params),
      );
    } catch (error) {
      logger.error(parseErrorMessage(error, options.errorParser).errorMessage);
    }
  };
}
