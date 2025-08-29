import * as buildsRoutes from "#builds/routes";
import * as labelsRoutes from "#labels/routes";
import * as projectsRoutes from "#projects/routes";
import { localStore } from "#store";
import { OpenApiRouter } from "#utils/api-router";
import { parseErrorMessage, type CustomErrorParser } from "#utils/error";
import { handleStaticFileRoute } from "./root/handlers";
import * as openapiRoutes from "./root/openapi";
import * as rootRoutes from "./root/routes";
import * as serveRoutes from "./root/serve";
import type {
  CheckPermissionsCallback,
  DatabaseService,
  Logger,
  StorageService,
} from "./types";

export type * from "./types";
export * from "#constants";
export * from "#utils/error";
export * from "#utils/url";

export interface RouterContext {
  database: DatabaseService;
  logger: Logger;
  checkPermissions?: CheckPermissionsCallback;
  customErrorParser?: CustomErrorParser;
  prefix: string;
  headless: boolean | undefined;
  staticDirs: readonly string[];
  storage: StorageService;
}

const openApiRouter = new OpenApiRouter();
openApiRouter.register(rootRoutes.root);
openApiRouter.register(rootRoutes.health);
openApiRouter.registerGroup("openapi", openapiRoutes);
openApiRouter.registerGroup("_", serveRoutes);
openApiRouter.registerGroup("projects", projectsRoutes);
openApiRouter.registerGroup("projects", labelsRoutes);
openApiRouter.registerGroup("projects", buildsRoutes);

const DEFAULT_CHECK_PERMISSIONS: CheckPermissionsCallback = () => true;

export async function router(
  request: Request,
  context: RouterContext,
): Promise<Response> {
  const {
    logger,
    prefix,
    checkPermissions = DEFAULT_CHECK_PERMISSIONS,
    customErrorParser,
    staticDirs,
  } = context;

  try {
    const response = await localStore.run(
      {
        checkPermissions,
        customErrorParser,
        database: context.database,
        headless: !!context.headless,
        logger,
        prefix,
        request,
        storage: context.storage,
        url: request.url,
      },
      async () => {
        return await openApiRouter.handleRequest(request);
      },
    );

    if (response) {
      return response;
    }

    const { pathname } = new URL(request.url);
    const filepath = pathname.replace(prefix, "");
    return await handleStaticFileRoute(filepath, staticDirs, logger);
  } catch (error) {
    return new Response(parseErrorMessage(error).errorMessage, { status: 500 });
  }
}
