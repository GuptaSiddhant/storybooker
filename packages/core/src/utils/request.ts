import { getStore } from "#store";
import { CONTENT_TYPES, QUERY_PARAMS } from "#utils/constants";

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

export function checkIsNewMode(request?: Request): boolean {
  const req = request || getStore().request;
  const { searchParams } = new URL(req.url);
  return searchParams.get(QUERY_PARAMS.mode) === QUERY_PARAMS.newResource;
}

export function checkIsEditMode(request?: Request): boolean {
  const req = request || getStore().request;
  const { searchParams } = new URL(req.url);
  return searchParams.get(QUERY_PARAMS.mode) === QUERY_PARAMS.editResource;
}

export function validateIsFormEncodedRequest(
  request?: Request,
): undefined | ErrorObject {
  const req = request || getStore().request;

  const contentType = req.headers.get("content-type");
  if (!contentType) {
    return {
      message: "Content-Type header is required",
      status: 400,
    };
  }
  if (!contentType.includes(CONTENT_TYPES.FORM_ENCODED)) {
    return {
      message: `Invalid Content-Type, expected ${CONTENT_TYPES.FORM_ENCODED}`,
      status: 415,
    };
  }

  return undefined;
}

export function validateBuildUploadZipBody(
  request: Request,
): ErrorObject | undefined {
  const { body } = request;
  if (!body) {
    return { message: "Request body is required", status: 400 };
  }
  const contentLength = request.headers.get("Content-Length");
  if (!contentLength) {
    return { message: "Content-Length header is required", status: 411 };
  }
  if (Number.parseInt(contentLength, 10) === 0) {
    return { message: "Request body should have length > 0", status: 400 };
  }

  return undefined;
}
