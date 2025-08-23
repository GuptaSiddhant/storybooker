import { HttpResponse, type HttpResponseInit } from "@azure/functions";
import { createElement } from "@kitajs/html";
import { renderToStream } from "@kitajs/html/suspense";
import { CONTENT_TYPES } from "#constants";
import { getStore } from "#store";
import { checkIsHTMLRequest, checkIsHXRequest } from "#utils/request";
import type { ZodOpenApiResponsesObject } from "zod-openapi";
import { parseErrorMessage } from "./error";

export const commonErrorResponses: ZodOpenApiResponsesObject = {
  400: { description: "Invalid request data" },
  401: { description: "Unauthenticated access" },
  403: { description: "Unauthorized access" },
  500: { description: "An unexpected server-error occurred." },
};

export function responseHTML(html: JSX.Element): HttpResponseInit {
  return {
    body: renderToStream(html),
    headers: { "Content-Type": CONTENT_TYPES.HTML },
    status: 200,
  };
}

export function responseRedirect(
  location: string,
  init: ResponseInit | number,
): HttpResponseInit {
  const status = typeof init === "number" ? init : (init?.status ?? 303);
  const headers = new Headers(typeof init === "number" ? {} : init?.headers);

  if (checkIsHXRequest()) {
    headers.set("HX-redirect", location);
  } else {
    headers.set("Location", location);
  }

  return { headers, status };
}

export function responseError(
  error: unknown,
  init?: ResponseInit | number,
): HttpResponseInit | HttpResponse {
  if (error instanceof HttpResponse) {
    return error;
  }
  if (error && typeof error === "object" && "status" in error) {
    return error as unknown as HttpResponseInit;
  }

  const { context } = getStore();

  try {
    const { errorMessage, errorStatus, errorType } = parseErrorMessage(error);
    context.error(
      `[${errorType}]`,
      errorMessage,
      error instanceof Error ? error.stack : "",
    );

    const status =
      errorStatus ?? (typeof init === "number" ? init : (init?.status ?? 500));
    const headers = new Headers(typeof init === "number" ? {} : init?.headers);

    if (checkIsHXRequest()) {
      return handleErrorResponseForHxRequest(errorMessage, headers, status);
    }

    if (checkIsHTMLRequest()) {
      return handleErrorResponseForHTMLRequest(errorMessage, headers, status);
    }

    headers.set("Content-Type", "application/json");

    return { headers, jsonBody: { errorMessage }, status };
  } catch (error) {
    context.error(`[ErrOnErr]`, error);

    return {
      body: typeof error === "string" ? error : undefined,
      jsonBody: typeof error === "string" ? undefined : error,
      status: 500,
    };
  }
}

function handleErrorResponseForHxRequest(
  errorMessage: string,
  headers: Headers,
  status: number,
): HttpResponseInit {
  try {
    headers.set("HXToaster-Type", "error");
    headers.set("HXToaster-Body", errorMessage);
  } catch {
    // Ignore the errors if error message is not serialisable
  }
  return { body: errorMessage, headers, status };
}

function handleErrorResponseForHTMLRequest(
  errorMessage: string,
  headers: Headers,
  status: number,
): HttpResponseInit {
  headers.set("Content-Type", CONTENT_TYPES.HTML);

  return {
    body: renderToStream(
      createElement(
        "div",
        {
          breadcrumbs: [{ href: "javascript:history.back()", label: "< Back" }],
          title: `Error ${status}`,
        },
        createElement("div", {}, errorMessage),
      ),
    ),
    headers,
    status,
  };
}
