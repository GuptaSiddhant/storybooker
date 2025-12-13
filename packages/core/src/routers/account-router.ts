import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { urlBuilder } from "../urls";
import { QUERY_PARAMS } from "../utils/constants";
import {
  openapiCommonErrorResponses,
  openapiResponseRedirect,
  openapiResponsesHtml,
} from "../utils/openapi-utils";
import { getStore } from "../utils/store";
import { createUIAdapterOptions } from "../utils/ui-utils";

const accountTag = "Account";

/**
 * @private
 */
export const accountRouter = new OpenAPIHono()
  .openapi(
    createRoute({
      summary: "Account page",
      method: "get",
      path: "/",
      tags: [accountTag],
      responses: {
        200: {
          description: "Render account page",
          content: openapiResponsesHtml,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { abortSignal, auth, logger, request, user, ui } = getStore();

      if (!auth) {
        throw new HTTPException(500, { message: "Auth is not setup" });
      }

      if (!user) {
        const { pathname } = new URL(urlBuilder.account());
        return context.redirect(urlBuilder.login(pathname), 302);
      }

      if (!ui?.renderAccountsPage) {
        throw new HTTPException(405, { message: "UI is not available for this route." });
      }

      const children = await auth.renderAccountDetails?.(user, {
        abortSignal,
        logger,
        request,
      });

      return context.html(ui.renderAccountsPage({ children }, createUIAdapterOptions()));
    },
  )
  .openapi(
    createRoute({
      summary: "Login to account",
      method: "get",
      path: "/login",
      tags: [accountTag],
      request: {
        query: z
          .object({ [QUERY_PARAMS.redirect]: z.string() })
          .partial()
          .loose(),
      },
      responses: {
        302: openapiResponseRedirect("Login successful"),
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { abortSignal, auth, logger, request } = getStore();

      if (!auth) {
        throw new HTTPException(500, { message: "Auth is not setup" });
      }

      const response = await auth.login({ abortSignal, logger, request });

      if (response.status >= 400) {
        return response;
      }

      const { redirect = "" } = context.req.valid("query");
      const location = new URL(redirect, urlBuilder.homepage());
      for (const [key, value] of response.headers) {
        context.res.headers.set(key, value);
      }

      return context.redirect(location.toString());
    },
  )
  .openapi(
    createRoute({
      summary: "Logout from account",
      method: "get",
      path: "/logout",
      tags: [accountTag],
      responses: {
        302: openapiResponseRedirect("Logout successful"),
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { abortSignal, auth, logger, request, user } = getStore();
      if (!auth) {
        throw new HTTPException(500, { message: "Auth is not setup" });
      }

      if (!user) {
        throw new HTTPException(401, { message: "User is not authenticated" });
      }

      const response = await auth.logout(user, {
        abortSignal,
        logger,
        request,
      });
      if (response.status >= 400) {
        return response;
      }

      const responseHeaders = new Headers(response.headers);
      const responseLocation = responseHeaders.get("location");
      responseHeaders.delete("location");
      for (const [key, value] of responseHeaders) {
        context.res.headers.set(key, value);
      }

      return context.redirect(responseLocation || urlBuilder.homepage());
    },
  );
