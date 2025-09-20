import type { RestError } from "@azure/core-rest-pipeline";
import type { HttpRequest, HttpResponseInit } from "@azure/functions";
import type { ErrorParser } from "@storybooker/core/types";
import type { BodyInit } from "undici";

export const parseAzureRestError: ErrorParser = (error) => {
  if (error instanceof Error && error.name === "RestError") {
    const restError = error as RestError;
    const details = (restError.details ?? {}) as Record<string, string>;
    const message: string = details["errorMessage"] ?? restError.message;

    return {
      errorMessage: `${details["errorCode"] ?? restError.name} (${
        restError.code ?? restError.statusCode
      }): ${message}`,
      errorStatus: restError.statusCode,
      errorType: "AzureRest",
    };
  }

  return;
};

export function transformHttpRequestToWebRequest(
  httpRequest: HttpRequest,
): Request {
  return new Request(httpRequest.url, {
    // oxlint-disable-next-line no-invalid-fetch-options
    body: httpRequest.body as ReadableStream | null,
    // @ts-expect-error - Duplex is required for streaming but not supported in TS
    duplex: "half",
    headers: new Headers(httpRequest.headers as Headers),
    method: httpRequest.method,
  });
}

export function transformWebResponseToHttpResponse(
  response: Response,
): HttpResponseInit {
  return {
    body: response.body as BodyInit | null,
    headers: new Headers(response.headers),
    status: response.status,
  };
}
