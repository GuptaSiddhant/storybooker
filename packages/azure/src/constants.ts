import type { HttpMethod } from "@azure/functions";
import type { CheckPermissionsCallback } from "./types";

export const SERVICE_NAME = "StoryBooker";
export const DEFAULT_STORAGE_CONN_STR_ENV_VAR = "AzureWebJobsStorage";
export const DEFAULT_PURGE_SCHEDULE_CRON = "0 0 0 * * *";
export const DEFAULT_STATIC_DIRS = ["./public"] as const;
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

export function DEFAULT_CHECK_PERMISSIONS_CALLBACK(): ReturnType<CheckPermissionsCallback> {
  return true;
}
