import { SuperHeaders } from "@remix-run/headers";
import { getStore } from "../utils/store";
import { mimes } from "./mime-utils";

interface ErrorObject {
  message: string;
  status: number;
}

export function checkIsHXRequest(request?: Request): boolean {
  const req = request || getStore().request;
  return req.headers.get("hx-request") === "true";
}

export function checkIsHTMLRequest(request?: Request): boolean {
  const req = request || getStore().request;
  const accept = req.headers.get("accept");
  return !!accept?.includes(mimes.html);
}

export function checkIsJSONRequest(request?: Request): boolean {
  const req = request || getStore().request;
  const accept = req.headers.get("accept");
  return !!accept?.includes(mimes.json);
}

export function validateIsFormEncodedRequest(
  request?: Request,
): undefined | ErrorObject {
  const store = getStore();
  const { contentType } = request
    ? new SuperHeaders(request.headers)
    : store.headers;

  if (!contentType) {
    return {
      message: store.translation.errorMessages.header_content_length_required,
      status: 400,
    };
  }

  if (!contentType.mediaType?.includes(mimes.formEncoded)) {
    return {
      message: `${store.translation.errorMessages.header_content_type_invalid}, ${store.translation.dictionary.expected} ${mimes.formEncoded}`,
      status: 415,
    };
  }

  return undefined;
}

export function validateBuildUploadZipBody(
  request: Request,
): ErrorObject | undefined {
  const { translation, headers: storeHeaders } = getStore();
  const { body } = request;

  if (!body) {
    return {
      message: translation.errorMessages.request_body_required,
      status: 400,
    };
  }

  const { contentLength } = request
    ? new SuperHeaders(request.headers)
    : storeHeaders;

  if (contentLength === null) {
    return {
      message: translation.errorMessages.header_content_length_required,
      status: 411,
    };
  }
  if (contentLength === 0) {
    return {
      message: translation.errorMessages.header_content_length_non_zero,
      status: 400,
    };
  }

  return undefined;
}

export function parseRequestCookieHeader(
  cookieHeaderOrRequest: string | Request,
): Record<string, string> {
  const cookieHeader =
    typeof cookieHeaderOrRequest === "string"
      ? cookieHeaderOrRequest
      : new Headers(cookieHeaderOrRequest.headers).get("cookie");

  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [key, value] = cookie.split("=");
    if (key !== undefined && value !== undefined) {
      cookies[decodeURIComponent(key.trim())] = decodeURIComponent(
        value.trim(),
      );
    }
  }

  return cookies;
}
