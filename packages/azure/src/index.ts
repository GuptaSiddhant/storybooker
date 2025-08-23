import { app } from "@azure/functions";
import { SERVICE_NAME } from "./constants";
import type { RegisterStorybookerRouterOptions } from "./types";
import { joinUrl } from "#utils/url-utils";

export type {
  CheckPermissionsCallback,
  OpenAPIOptions,
  Permission,
  PermissionAction,
  PermissionResource,
  RegisterStorybookerRouterOptions,
} from "./types.ts";

export function registerStoryBookerRouter(
  options: RegisterStorybookerRouterOptions = {}
): void {
  const { authLevel, route = "" } = options;

  console.log("Registering Storybooker Router");

  app.setup({ enableHttpStream: true });

  app.http(SERVICE_NAME, {
    methods: [
      "DELETE",
      "GET",
      "HEAD",
      "OPTIONS",
      "PATCH",
      "POST",
      "PUT",
      "TRACE",
    ],
    authLevel,
    route: joinUrl(route, "{**path}"),
    handler: (request, context) => {
      context.log(`[%s] %s`, request.method, request.url);
      return { status: 405 };
    },
  });
}
