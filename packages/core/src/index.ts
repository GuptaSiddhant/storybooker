import * as buildsRoutes from "#builds/routes";
import * as labelsRoutes from "#labels/routes";
import * as projectsRoutes from "#projects/routes";
import { localStore, type Store } from "#store";
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
  headless?: boolean;
  staticDirs?: readonly string[];
  storage: StorageService;
}

export type RequestHandler = (request: Request) => Promise<Response>;

const router = new OpenApiRouter();
router.register(rootRoutes.root);
router.register(rootRoutes.health);
router.registerGroup("openapi", openapiRoutes);
router.registerGroup("_", serveRoutes);
router.registerGroup("projects", projectsRoutes);
router.registerGroup("projects", labelsRoutes);
router.registerGroup("projects", buildsRoutes);

const DEFAULT_CHECK_PERMISSIONS: CheckPermissionsCallback = () => true;
const DEFAULT_STATIC_DIRS = ["./public"];

export function createRequestHandler(context: RouterContext): RequestHandler {
  return requestHandler.bind(null, context);
}

async function requestHandler(
  context: RouterContext,
  request: Request,
): Promise<Response> {
  const { logger, prefix, staticDirs = DEFAULT_STATIC_DIRS } = context;

  const store: Store = {
    checkPermissions: DEFAULT_CHECK_PERMISSIONS,
    customErrorParser: undefined,
    ...context,
    headless: !!context.headless,
    request,
    url: request.url,
  };

  try {
    const response = await localStore.run(store, () => router.handleRequest());
    if (response) {
      return response;
    }

    const { pathname } = new URL(request.url);
    const filepath = pathname.replace(prefix, "");

    return await localStore.run(store, () =>
      handleStaticFileRoute(filepath, staticDirs, logger),
    );
  } catch (error) {
    return new Response(parseErrorMessage(error).errorMessage, { status: 500 });
  }
}
