import {
  app,
  type HttpRequest,
  type HttpResponse,
  type HttpResponseInit,
  type InvocationContext,
  type Timer,
} from "@azure/functions";
import { urlJoin } from "#utils/url-utils";
import {
  DEFAULT_CHECK_PERMISSIONS_CALLBACK,
  DEFAULT_PURGE_SCHEDULE_CRON,
  DEFAULT_STATIC_DIRS,
  DEFAULT_STORAGE_CONN_STR_ENV_VAR,
  SERVICE_NAME,
  SUPPORTED_HTTP_METHODS,
} from "./constants";
import type {
  CheckPermissionsCallback,
  Permission,
  RegisterStorybookerRouterOptions,
} from "./types";

export type {
  CheckPermissionsCallback,
  OpenAPIOptions,
  Permission,
  PermissionAction,
  PermissionResource,
  RegisterStorybookerRouterOptions,
} from "./types.ts";

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
    staticDirs,
  );

  const storageConnectionString = process.env[storageConnectionStringEnvVar];
  if (!storageConnectionString) {
    throw new Error(
      `Missing env-var '${storageConnectionStringEnvVar}' value.
It is required to connect with Azure Storage resource.`,
    );
  }

  app.setup({ enableHttpStream: true });

  app.http(SERVICE_NAME, {
    authLevel,
    handler: mainHandler.bind(null, {
      checkPermissions,
      storageConnectionString,
    }),
    methods: SUPPORTED_HTTP_METHODS,
    route: urlJoin(route, "{**path}"),
  });

  if (purgeScheduleCron !== null) {
    app.timer(`${SERVICE_NAME}-timer_purge`, {
      handler: timerPurgeHandler,
      runOnStartup: false,
      schedule: purgeScheduleCron || DEFAULT_PURGE_SCHEDULE_CRON,
    });
  }
}

async function mainHandler(
  options: {
    checkPermissions: CheckPermissionsCallback;
    storageConnectionString: string;
  },
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponse | HttpResponseInit> {
  const { checkPermissions } = options;
  const projectId = "";
  context.log(`[%s] %s`, request.method, request.url);
  const permissions: Permission[] = [{ action: "read", resource: "ui" }];
  const permitted = await checkPermissions(permissions, request, context);

  if (permitted === true) {
    return { status: 200 };
  }

  const message = `Permission denied [${permissions
    .map((permission) => `'${permission.resource}:${permission.action}'`)
    .join(", ")}] (project: ${projectId})`;
  context.warn(message);
  if (permitted === false) {
    return { body: message, status: 403 };
  }
  return permitted;
}

function timerPurgeHandler(timer: Timer, context: InvocationContext): void {
  context.log(timer.schedule);
}
