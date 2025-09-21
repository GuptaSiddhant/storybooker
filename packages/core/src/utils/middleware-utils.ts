import type {
  Middleware,
  RequestHandler,
  RequestHandlerOverrideOptions,
} from "../types";

export function createMiddlewaresPipelineRequestHandler(
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
