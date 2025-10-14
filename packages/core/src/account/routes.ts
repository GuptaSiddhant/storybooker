import { urlBuilder, URLS } from "../urls";
import {
  responseError,
  responseHTML,
  responseRedirect,
} from "../utils/response";
import { defineRoute } from "../utils/router-utils";
import { getStore } from "../utils/store";
import { renderAccountPage } from "./render";

export const login = defineRoute("get", URLS.ui.login, undefined, async () => {
  const { abortSignal, auth, request, translation, url } = getStore();
  if (!auth?.login) {
    return await responseError(
      translation.errorMessages.auth_setup_missing,
      404,
    );
  }

  const response = await auth.login(request, { abortSignal });

  if (response.status >= 400) {
    return response;
  }

  const redirectTo = new URL(url).searchParams.get("redirect") || "";

  return responseRedirect(url.replace(URLS.ui.login, redirectTo), {
    headers: response.headers,
    status: 302,
  });
});

export const logout = defineRoute(
  "get",
  URLS.ui.logout,
  undefined,
  async () => {
    const { abortSignal, auth, request, translation, url, user } = getStore();
    if (!auth?.logout || !user) {
      return await responseError(
        translation.errorMessages.auth_setup_missing,
        404,
      );
    }

    const response = await auth.logout(request, user, { abortSignal });
    if (response.status >= 400) {
      return response;
    }

    const serviceUrl = url.replace(URLS.ui.logout, "");
    return responseRedirect(serviceUrl, {
      headers: response.headers,
      status: 302,
    });
  },
);

export const account = defineRoute(
  "get",
  URLS.ui.account,
  undefined,
  async () => {
    const { abortSignal, auth, request, user, translation, url } = getStore();
    if (!auth) {
      return await responseError(
        translation.errorMessages.auth_setup_missing,
        404,
      );
    }

    if (!user) {
      const serviceUrl = url.replace(URLS.ui.account, "");

      if (auth.login) {
        return responseRedirect(urlBuilder.login(URLS.ui.account), 302);
      }

      return responseRedirect(serviceUrl, 404);
    }

    const children = await auth.renderAccountDetails?.(request, user, {
      abortSignal,
    });

    return await responseHTML(renderAccountPage({ children }));
  },
);
