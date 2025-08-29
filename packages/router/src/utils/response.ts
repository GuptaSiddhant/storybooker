import { DocumentLayout } from "#components/document";
import { ErrorMessage } from "#components/error-message";
import { getStore } from "#store";
import { CONTENT_TYPES, HEADERS } from "#utils/constants";
import { checkIsHTMLRequest, checkIsHXRequest } from "#utils/request";
import type { ZodOpenApiResponsesObject } from "zod-openapi";
import { parseErrorMessage } from "./error";

export const commonErrorResponses: ZodOpenApiResponsesObject = {
  400: { description: "Invalid request data" },
  401: { description: "Unauthenticated access" },
  403: { description: "Unauthorized access" },
  500: { description: "An unexpected server-error occurred." },
};

export function responseHTML(html: JSX.Element, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set(HEADERS.contentType, CONTENT_TYPES.HTML);
  return new Response(html as unknown as BodyInit, {
    ...init,
    headers,
    status: init?.status || 200,
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
      return handleErrorResponseForHTMLRequest(
        errorType === "string" ? errorMessage : JSON.stringify(errorMessage),
        headers,
        status,
      );
    }

    headers.set("Content-Type", "application/json");

    return Response.json({ errorMessage }, { headers, status });
  } catch (error) {
    logger.error(`[ErrOnErr]`, error);
    const { errorMessage } = parseErrorMessage(error);
    return new Response(errorMessage, { status: 500 });
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
  return responseHTML(
    DocumentLayout({
      breadcrumbs: [{ href: "javascript:history.back()", label: "< Back" }],
      children: ErrorMessage({ children: errorMessage }),
      title: `Error ${status}`,
    }),
    { headers, status },
  );
}
