import SuperHeaders from "@remix-run/headers";
import z from "zod";
import type { ZodOpenApiResponsesObject } from "zod-openapi";
import { renderErrorPage } from "../ui/root-pages";
import { checkIsHTMLRequest, checkIsHXRequest } from "../utils/request";
import { getStore } from "../utils/store";
import { parseErrorMessage } from "./error";
import { mimes } from "./mime-utils";
import { toTitleCase } from "./text-utils";

export const errorSchema = z
  .object({ errorMessage: z.string() })
  .meta({ id: "error" });
export const errorContent = { "application/json": { schema: errorSchema } };

export function commonErrorResponses(): ZodOpenApiResponsesObject {
  return {
    400: {
      content: errorContent,
      description: "Invalid request data",
    },
    401: {
      content: errorContent,
      description: "Unauthenticated access",
    },
    403: {
      content: errorContent,
      description: "Unauthorised access",
    },
    500: {
      content: errorContent,
      description: "An unexpected server-error occurred.",
    },
  };
}

export async function responseHTML(
  html: JSX.Element,
  init?: ResponseInit,
): Promise<Response> {
  const headers = new SuperHeaders(init?.headers);
  headers.contentType = mimes.html;

  const responseInit: ResponseInit = {
    ...init,
    headers,
    status: init?.status || 200,
  };

  if (html instanceof Promise) {
    return new Response(await html, responseInit);
  }

  return new Response(html, responseInit);
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

export async function responseError(
  error: unknown,
  init?: ResponseInit | number,
): Promise<Response> {
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
      return await handleErrorResponseForHTMLRequest(
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

async function handleErrorResponseForHTMLRequest(
  errorMessage: string,
  headers: Headers,
  status: number,
): Promise<Response> {
  const { translation } = getStore();

  return await responseHTML(
    renderErrorPage({
      message: errorMessage,
      title: `${toTitleCase(translation.dictionary.error)} ${status}`,
    }),
    { headers, status },
  );
}
