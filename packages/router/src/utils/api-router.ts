import { getStore } from "#store";
import type {
  ZodOpenApiPathItemObject,
  ZodOpenApiPathsObject,
} from "zod-openapi";
import { responseError } from "./response";
import { urlJoin } from "./url";

// @ts-expect-error: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import("urlpattern-polyfill");
}

type Methods =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";

type ExtractParam<Segment extends string> = Segment extends `:${infer Param}?`
  ? Param extends `${infer Int}(\\d)`
    ? { [Key in Int]?: number }
    : { [Key in Param]?: string }
  : Segment extends `:${infer Param}`
    ? Param extends `${infer Int}(\\d)`
      ? { [Key in Int]?: number }
      : { [Key in Param]: string }
    : // oxlint-disable-next-line no-empty-object-type
      {}; // oxlint-disable-line ban-types

// Recursively split path by '/' and merge param objects
type ExtractParams<Path extends string> =
  Path extends `${infer Head}/${infer Tail}`
    ? ExtractParam<Head> & ExtractParams<Tail>
    : ExtractParam<Path>;

type Handler<Path extends string> = (options: {
  params: ExtractParams<Path>;
  request: Request;
}) => Promise<Response> | Response;

interface Route<Method extends Methods, Path extends string> {
  method: Method;
  pattern: URLPattern;
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

export class OpenApiRouter {
  static paths: ZodOpenApiPathsObject = {};

  private routes: Route<Methods, string>[] = [];

  register<Method extends Methods, Path extends string>(
    options: RegisterRouteOptions<Method, Path>,
  ): this {
    const { handler, input, method, overriddenPath, pathname } = options;
    const pattern = new URLPattern({ pathname });
    this.routes.push({
      handler,
      method,
      pattern,
    });

    if (input) {
      const path = overriddenPath ?? pathname;
      if (OpenApiRouter.paths[path]) {
        OpenApiRouter.paths[path][method] = input;
      } else {
        OpenApiRouter.paths[path] = { [method]: input };
      }
    }

    return this;
  }

  registerGroup(
    prefix: string,
    group: Record<string, RegisterRouteOptions<Methods, string>>,
  ): this {
    for (const route of Object.values(group)) {
      this.register({
        ...route,
        overriddenPath: route.overriddenPath
          ? urlJoin(prefix, route.overriddenPath)
          : undefined,
        pathname: urlJoin(prefix, route.pathname),
      });
    }

    return this;
  }

  async handleRequest(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url);
    const method = request.method.toLowerCase();
    const { logger } = getStore();
    logger.log(`[${method}] ${url}`);

    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }

      const match = route.pattern.exec(url);
      if (!match) {
        continue;
      }

      try {
        // oxlint-disable-next-line no-await-in-loop
        return await route.handler({
          params: match.pathname.groups,
          request,
        });
      } catch (error) {
        return responseError(error, 500);
      }
    }

    return undefined;
  }
}

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
