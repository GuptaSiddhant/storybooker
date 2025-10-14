import { CONTENT_TYPES, HEADERS } from "../utils/constants";
import { getStore } from "../utils/store";

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
  return !!accept?.includes(CONTENT_TYPES.HTML);
}

export function checkIsJSONRequest(request?: Request): boolean {
  const req = request || getStore().request;
  const accept = req.headers.get("accept");
  return !!accept?.includes(CONTENT_TYPES.JSON);
}

export function validateIsFormEncodedRequest(
  request?: Request,
): undefined | ErrorObject {
  const store = getStore();
  const req = request || store.request;

  const contentType = req.headers.get(HEADERS.contentType);
  if (!contentType) {
    return {
      message: store.translation.errorMessages.header_content_length_required,
      status: 400,
    };
  }
  if (!contentType.includes(CONTENT_TYPES.FORM_ENCODED)) {
    return {
      message: `${store.translation.errorMessages.header_content_type_invalid}, ${store.translation.dictionary.expected} ${CONTENT_TYPES.FORM_ENCODED}`,
      status: 415,
    };
  }

  return undefined;
}

export function validateBuildUploadZipBody(
  request: Request,
): ErrorObject | undefined {
  const { translation } = getStore();
  const { body } = request;

  if (!body) {
    return {
      message: translation.errorMessages.request_body_required,
      status: 400,
    };
  }
  const contentLength = request.headers.get(HEADERS.contentLength);
  if (!contentLength) {
    return {
      message: translation.errorMessages.header_content_length_required,
      status: 411,
    };
  }
  if (Number.parseInt(contentLength, 10) === 0) {
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
      : new Headers(cookieHeaderOrRequest.headers).get(HEADERS.cookie);

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
