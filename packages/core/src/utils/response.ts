import type { MiddlewareHandler } from "hono";
import { checkIsHXRequest } from "../utils/request.ts";

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
