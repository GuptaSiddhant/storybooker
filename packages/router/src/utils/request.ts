import { getStore } from "#store";
import { CONTENT_TYPES, QUERY_PARAMS } from "#utils/constants";

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
): undefined | { message: string; status: number } {
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
