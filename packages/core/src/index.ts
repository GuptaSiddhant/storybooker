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
import { router } from "./router";
import type {
  AuthService,
  BrandingOptions,
  DatabaseService,
  LoggerService,
  OpenAPIOptions,
  StorageService,
  StoryBookerUser,
} from "./types";

export type * from "./types";
export * from "#constants";
export * from "#utils/error";
export * from "#utils/url";

export interface RequestHandlerOptions<User extends StoryBookerUser> {
  auth?: AuthService<User>;
  branding?: BrandingOptions;
  database: DatabaseService;
  logger?: LoggerService;
  customErrorParser?: CustomErrorParser;
  prefix?: string;
  openAPI?: OpenAPIOptions;
  headless?: boolean;
  staticDirs?: readonly string[];
  storage: StorageService;
}

export type RequestHandler = (request: Request) => Promise<Response>;

router.registerGroup(rootRoutes);
router.registerGroup(openapiRoutes);
router.registerGroup(serveRoutes);
router.registerGroup(projectsRoutes);
router.registerGroup(labelsRoutes);
router.registerGroup(buildsRoutes);

export { router };

export function createRequestHandler<User extends StoryBookerUser>(
  options: RequestHandlerOptions<User>,
): RequestHandler {
  return async function requestHandler(request: Request): Promise<Response> {
    try {
      const locale =
        request.headers.get(HEADERS.acceptLanguage)?.split(",").at(0) ||
        DEFAULT_LOCALE;
      const user = await options.auth?.getUserDetails(request);

      localStore.enterWith({
        auth: options.auth as AuthService | undefined,
        branding: options.branding,
        customErrorParser: options.customErrorParser,
        database: options.database,
        headless: !!options.headless,
        locale,
        logger: options.logger || console,
        openAPI: options.openAPI,
        prefix: options.prefix || "",
        request,
        storage: options.storage,
        url: request.url,
        user,
      });

      const response = await router.handleRequest();
      if (response) {
        return response;
      }

      return await handleStaticFileRoute(options.staticDirs);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }

      const { errorMessage } = parseErrorMessage(
        error,
        options.customErrorParser,
      );
      return new Response(errorMessage, { status: 500 });
    }
  };
}
