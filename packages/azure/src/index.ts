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
import { timerPurgeHandler } from "./handlers/timer-purge";
import { mainHandler } from "./handlers/main";

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
  const route = options.route || "";
  // oxlint-disable-next-line no-console
  console.log("Registering Storybooker Router (route: %s)", route || "/");

  const { storageConnectionString } = validateRegisterOptions(options);
  const routerOptions: RouterHandlerOptions = {
    baseRoute: route,
    checkPermissions:
      options.checkPermissions || DEFAULT_CHECK_PERMISSIONS_CALLBACK,
    openAPI: options.openAPI,
    staticDirs: options.staticDirs || DEFAULT_STATIC_DIRS,
    storageConnectionString,
  };

  app.setup({ enableHttpStream: true });

  app.http(SERVICE_NAME, {
    authLevel: options.authLevel,
    handler: wrapHttpHandlerWithStore(routerOptions, mainHandler),
    methods: SUPPORTED_HTTP_METHODS,
    route: urlJoin(route, "{**path}"),
  });

  if (options.purgeScheduleCron !== null) {
    app.timer(`${SERVICE_NAME}-timer_purge`, {
      handler: wrapTimerHandlerWithStore(routerOptions, timerPurgeHandler),
      runOnStartup: false,
      schedule: options.purgeScheduleCron || DEFAULT_PURGE_SCHEDULE_CRON,
    });
  }
}

function validateRegisterOptions(options: RegisterStorybookerRouterOptions): {
  storageConnectionString: string;
} {
  const storageConnectionStringEnvVar =
    options.storageConnectionStringEnvVar || DEFAULT_STORAGE_CONN_STR_ENV_VAR;
  const storageConnectionString = process.env[storageConnectionStringEnvVar];
  if (!storageConnectionString) {
    throw new Error(
      `Missing env-var '${storageConnectionStringEnvVar}' value.
It is required to connect with Azure Storage resource.`,
    );
  }

  return { storageConnectionString };
}
