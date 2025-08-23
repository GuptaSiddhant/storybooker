import { app } from "@azure/functions";
import {
  DEFAULT_CHECK_PERMISSIONS_CALLBACK,
  DEFAULT_PURGE_SCHEDULE_CRON,
  DEFAULT_STATIC_DIRS,
  DEFAULT_STORAGE_CONN_STR_ENV_VAR,
  SERVICE_NAME,
  SUPPORTED_HTTP_METHODS,
} from "#constants";
import {
  wrapHttpHandlerWithStore,
  wrapTimerHandlerWithStore,
  type RouterHandlerOptions,
} from "#store";
import type { RegisterStorybookerRouterOptions } from "#types";
import { urlJoin } from "#utils/url";
import { mainHandler } from "./handlers/main";
import { timerPurgeHandler } from "./handlers/timer-purge";

export type {
  CheckPermissionsCallback,
  OpenAPIOptions,
  Permission,
  PermissionAction,
  PermissionResource,
  RegisterStorybookerRouterOptions,
} from "#types";

export function registerStoryBookerRouter(
  options: RegisterStorybookerRouterOptions = {},
): void {
  const {
    authLevel,
    checkPermissions = DEFAULT_CHECK_PERMISSIONS_CALLBACK,
    openAPI,
    purgeScheduleCron,
    route = "",
    staticDirs = DEFAULT_STATIC_DIRS,
    storageConnectionStringEnvVar = DEFAULT_STORAGE_CONN_STR_ENV_VAR,
  } = options;

  // oxlint-disable-next-line no-console
  console.log(
    "Registering Storybooker Router (%s OpenAPI), StaticDirs: %s",
    openAPI === null ? "without" : "with",
  );

  const storageConnectionString = process.env[storageConnectionStringEnvVar];
  if (!storageConnectionString) {
    throw new Error(
      `Missing env-var '${storageConnectionStringEnvVar}' value.
It is required to connect with Azure Storage resource.`,
    );
  }

  const routerOptions: RouterHandlerOptions = {
    baseRoute: route,
    checkPermissions,
    connectionString: storageConnectionString,
    openAPI,
    staticDirs,
  };

  app.setup({ enableHttpStream: true });

  app.http(SERVICE_NAME, {
    authLevel,
    handler: wrapHttpHandlerWithStore(routerOptions, mainHandler),
    methods: SUPPORTED_HTTP_METHODS,
    route: urlJoin(route, "{**path}"),
  });

  if (purgeScheduleCron !== null) {
    app.timer(`${SERVICE_NAME}-timer_purge`, {
      handler: wrapTimerHandlerWithStore(routerOptions, timerPurgeHandler),
      runOnStartup: false,
      schedule: purgeScheduleCron || DEFAULT_PURGE_SCHEDULE_CRON,
    });
  }
}
