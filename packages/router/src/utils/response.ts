import { createElement } from "@kitajs/html";
import { renderToStream } from "@kitajs/html/suspense";
import { CONTENT_TYPES } from "#utils/constants";
import { checkIsHTMLRequest, checkIsHXRequest } from "#utils/request";
import type { ZodOpenApiResponsesObject } from "zod-openapi";
import { parseErrorMessage } from "./error";
import { getStore } from "#store";

export const commonErrorResponses: ZodOpenApiResponsesObject = {
  400: { description: "Invalid request data" },
  401: { description: "Unauthenticated access" },
  403: { description: "Unauthorized access" },
  500: { description: "An unexpected server-error occurred." },
};

export function responseHTML(html: JSX.Element): Response {
  return new Response(renderToStream(html) as unknown as BodyInit, {
    headers: { "Content-Type": CONTENT_TYPES.HTML },
    status: 200,
  });
}

export function responseRedirect(
  location: string,
  init: ResponseInit | number,
): Response {
  const status = typeof init === "number" ? init : (init?.status ?? 303);
  const headers = new Headers(typeof init === "number" ? {} : init?.headers);

  if (checkIsHXRequest()) {
    headers.set("HX-redirect", location);
  } else {
    headers.set("Location", location);
  }

  return new Response(null, { headers, status });
}

export function responseError(
  error: unknown,
  init?: ResponseInit | number,
): Response {
  if (error instanceof Response) {
    return error;
  }

  const { logger } = getStore();

  try {
    const { errorMessage, errorStatus, errorType } = parseErrorMessage(error);
    logger.error(
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

    return Response.json({ errorMessage }, { headers, status });
  } catch (error) {
    logger.error(`[ErrOnErr]`, error);
    return typeof error === "string"
      ? new Response(error, { status: 500 })
      : Response.json(error, { status: 500 });
  }
}

function handleErrorResponseForHxRequest(
  errorMessage: string,
  headers: Headers,
  status: number,
): Response {
  try {
    headers.set("HXToaster-Type", "error");
    headers.set("HXToaster-Body", errorMessage);
  } catch {
    // Ignore the errors if error message is not serialisable
  }
  return new Response(errorMessage, { headers, status });
}

function handleErrorResponseForHTMLRequest(
  errorMessage: string,
  headers: Headers,
  status: number,
): Response {
  headers.set("Content-Type", CONTENT_TYPES.HTML);
  return new Response(
    renderToStream(
      createElement(
        "div",
        {
          breadcrumbs: [{ href: "javascript:history.back()", label: "< Back" }],
          title: `Error ${status}`,
        },
        createElement("div", {}, errorMessage),
      ),
    ) as unknown as BodyInit,
    {
      headers,
      status,
    },
  );
}
