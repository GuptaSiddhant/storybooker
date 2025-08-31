import * as buildsRoutes from "#builds/routes";
import { DEFAULT_LOCALE, HEADERS } from "#constants";
import * as labelsRoutes from "#labels/routes";
import * as projectsRoutes from "#projects/routes";
import { localStore } from "#store";
import { parseErrorMessage, type CustomErrorParser } from "#utils/error";
import { handleStaticFileRoute } from "./root/handlers";
import * as openapiRoutes from "./root/openapi";
import * as rootRoutes from "./root/routes";
import * as serveRoutes from "./root/serve";
import { Router } from "./router";
import type {
  CheckPermissionsCallback,
  DatabaseService,
  LoggerService,
  StorageService,
} from "./types";

export type * from "./types";
export * from "#constants";
export * from "#utils/error";
export * from "#utils/url";

export interface RouterContext {
  database: DatabaseService;
  logger?: LoggerService;
  checkPermissions?: CheckPermissionsCallback;
  customErrorParser?: CustomErrorParser;
  prefix?: string;
  headless?: boolean;
  staticDirs?: readonly string[];
  storage: StorageService;
}

export type RequestHandler = (request: Request) => Promise<Response>;

const router = new Router();
router.registerGroup(rootRoutes);
router.registerGroup(openapiRoutes);
router.registerGroup(serveRoutes);
router.registerGroup(projectsRoutes);
router.registerGroup(labelsRoutes);
router.registerGroup(buildsRoutes);

const DEFAULT_CHECK_PERMISSIONS: CheckPermissionsCallback = () => true;

export function createRequestHandler(context: RouterContext): RequestHandler {
  return async function requestHandler(request: Request): Promise<Response> {
    const locale =
      request.headers.get(HEADERS.acceptLanguage)?.split(",").at(0) ||
      DEFAULT_LOCALE;

    localStore.enterWith({
      checkPermissions: context.checkPermissions || DEFAULT_CHECK_PERMISSIONS,
      customErrorParser: context.customErrorParser,
      database: context.database,
      headless: !!context.headless,
      locale,
      logger: context.logger || console,
      prefix: context.prefix || "",
      request,
      storage: context.storage,
      url: request.url,
    });

    try {
      const response = await router.handleRequest();
      if (response) {
        return response;
      }

      return await handleStaticFileRoute(context.staticDirs);
    } catch (error) {
      const { errorMessage } = parseErrorMessage(error);
      return new Response(errorMessage, { status: 500 });
    }
  };
}
