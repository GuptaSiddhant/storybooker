import type { HttpMethod } from "@azure/functions";
import type { CheckPermissionsCallback } from "./types";

export const SERVICE_NAME = "StoryBooker";
export const DEFAULT_STORAGE_CONN_STR_ENV_VAR = "AzureWebJobsStorage";
export const DEFAULT_PURGE_SCHEDULE_CRON = "0 0 0 * * *";
export const DEFAULT_STATIC_DIRS = ["./public"] as const;
export const DEFAULT_LOCALE = "en";

export const CACHE_CONTROL_PUBLIC_YEAR = "public, max-age=31536000, immutable";
export const CACHE_CONTROL_PUBLIC_WEEK = "public, max-age=604800, immutable";
export const DEFAULT_PURGE_AFTER_DAYS = 30;
export const DEFAULT_GITHUB_BRANCH = "main";
export const ONE_DAY_IN_MS: number = 24 * 60 * 60 * 1000;

export const SUPPORTED_HTTP_METHODS: HttpMethod[] = [
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
  "TRACE",
];
export const CONTENT_TYPES = {
  ANY: "*/*",
  FORM_ENCODED: "application/x-www-form-urlencoded",
  FORM_MULTIPART: "multipart/form-data",
  HTML: "text/html",
  JSON: "application/json",
  ZIP: "application/zip",
} as const;
export const QUERY_PARAMS = {
  editResource: "edit",
  labelSlug: "labelSlug",
  mode: "mode",
  newResource: "new",
};
export const HEADERS = {
  contentType: "Content-Type",
};

export function DEFAULT_CHECK_PERMISSIONS_CALLBACK(): ReturnType<CheckPermissionsCallback> {
  return true;
}
