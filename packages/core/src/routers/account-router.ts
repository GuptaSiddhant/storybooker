import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { urlBuilder } from "../urls";
import { QUERY_PARAMS } from "../utils/constants";
import {
  openapiCommonErrorResponses,
  openapiResponseRedirect,
  openapiResponsesHtml,
} from "../utils/openapi-utils";
import { responseError, responseRedirect } from "../utils/response";
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

      if (!auth || !ui) {
        return await responseError("Auth is not setup", 500);
      }

      if (!user) {
        if (auth.login) {
          const { pathname } = new URL(urlBuilder.account());
          return responseRedirect(urlBuilder.login(pathname), 302);
        }

        return responseRedirect(urlBuilder.homepage(), 401);
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

      if (!auth?.login) {
        return await responseError("Auth is not setup", 500);
      }

      const response = await auth.login({ abortSignal, logger, request });

      if (response.status >= 400) {
        return response;
      }

      const { redirect = "" } = context.req.valid("query");
      const location = new URL(redirect, urlBuilder.homepage());

      return responseRedirect(location.toString(), {
        headers: response.headers,
        status: 302,
      });
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
    async () => {
      const { abortSignal, auth, logger, request, user } = getStore();
      if (!auth?.logout || !user) {
        return await responseError("Auth is not setup", 500);
      }

      const response = await auth.logout(user, {
        abortSignal,
        logger,
        request,
      });
      if (response.status >= 400) {
        return response;
      }

      return responseRedirect(urlBuilder.homepage(), {
        headers: response.headers,
        status: 302,
      });
    },
  );
