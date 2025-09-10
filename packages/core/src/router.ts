import { RoutePattern, type Params } from "@remix-run/route-pattern";
import { getStore } from "#store";
import { responseError } from "#utils/response";
import type {
  ZodOpenApiPathItemObject,
  ZodOpenApiPathsObject,
} from "zod-openapi";

type Methods =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";

type Handler<Path extends string> = (options: {
  params: Params<Path>;
  request: Request;
}) => Promise<Response> | Response;

interface Route<Method extends Methods, Path extends string> {
  method: Method;
  pattern: RoutePattern<Path>;
  handler: Handler<Path>;
}

export interface RegisterRouteOptions<
  Method extends Methods,
  Path extends string,
> {
  method: Method;
  pathname: Path;
  handler: Handler<Path>;
  input: ZodOpenApiPathItemObject[Method] | undefined;
  overriddenPath?: string;
}

class Router {
  paths: ZodOpenApiPathsObject = {};

  private routes: Route<Methods, string>[] = [];

  register<Method extends Methods, Path extends string>(
    options: RegisterRouteOptions<Method, Path>,
  ): this {
    const { handler, input, method, overriddenPath, pathname } = options;
    const pattern = new RoutePattern(pathname);
    this.routes.push({
      handler,
      method,
      pattern,
    });

    if (input) {
      let path = (overriddenPath ?? pathname).replaceAll(/:(\w+)/g, "{$1}");
      if (!path.startsWith("/")) {
        path = `/${path}`;
      }

      const pathObject = this.paths[path];
      if (pathObject) {
        pathObject[method] = input;
      } else {
        this.paths[path] = { [method]: input };
      }
    }

    return this;
  }

  registerGroup(
    group: Record<string, RegisterRouteOptions<Methods, string>>,
  ): this {
    for (const route of Object.values(group)) {
      this.register(route);
    }

    return this;
  }

  async handleRequest(): Promise<Response | undefined> {
    const { logger, request, prefix, url } = getStore();
    const method = request.method.toLowerCase();
    const { pathname } = new URL(url);
    logger.log(`[${method.toUpperCase()}] ${pathname}`);

    const urlWithoutPrefix = prefix ? url.replace(`${prefix}/`, "") : url;
    const urlWithoutTrailingSlash = urlWithoutPrefix.endsWith("/")
      ? urlWithoutPrefix.slice(0, -1)
      : urlWithoutPrefix;

    for (const route of this.routes) {
      if (route.method.toLowerCase() !== method.toLowerCase()) {
        continue;
      }

      try {
        const match = route.pattern.match(urlWithoutTrailingSlash);
        if (!match) {
          continue;
        }

        // oxlint-disable-next-line no-await-in-loop
        return await route.handler({
          params: match.params,
          request,
        });
      } catch (error) {
        return responseError(error, 500);
      }
    }

    return undefined;
  }
}

export const router = new Router();

// oxlint-disable-next-line max-params
export function defineRoute<Method extends Methods, Path extends string>(
  method: Method,
  pathname: Path,
  input:
    | (ZodOpenApiPathItemObject[Method] & { overridePath?: string })
    | undefined,
  handler: Handler<Path>,
): RegisterRouteOptions<Method, Path> {
  const overriddenPath = input?.overridePath;
  delete input?.overridePath;

  return {
    handler,
    input,
    method,
    overriddenPath,
    pathname,
  };
}
