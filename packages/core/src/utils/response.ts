import type { Context, MiddlewareHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { RenderedContent, UIAdapterOptions } from "../adapters/ui";
import { checkIsHXRequest } from "../utils/request";
import { createUIAdapterOptions } from "./ui-utils";

/**
 * Middleware to handle htmx redirects.
 * If the response status is a redirect (3xx) and the request is an htmx request,
 * it sets the "HX-redirect" header with the redirect location and removes the "Location" header.
 */
export function htmxRedirectResponse(): MiddlewareHandler {
  return async (ctx, next) => {
    await next();
    if (ctx.res.status >= 300 && ctx.res.status < 400) {
      const location = ctx.res.headers.get("Location");
      if (location && checkIsHXRequest(ctx.req.raw)) {
        ctx.res.headers.set("HX-redirect", location);
        ctx.res.headers.delete("Location");
      }
    }
  };
}

// oxlint-disable-next-line max-params
export function responseHTML<Props extends Record<string, unknown>>(
  context: Context,
  render: (props: Props, options: UIAdapterOptions) => RenderedContent,
  props: NoInfer<Props>,
  init?: ResponseInit | Response | number,
): Promise<Response> | Response {
  const content = render(props, createUIAdapterOptions());

  return context.html(content, init as unknown as ContentfulStatusCode);
}
