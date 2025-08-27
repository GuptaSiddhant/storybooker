import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { CACHE_CONTROL_PUBLIC_WEEK, SERVICE_NAME } from "#constants";
import * as labelsRoutes from "#labels/routes";
import * as projectsRoutes from "#projects/routes";
import { localStore } from "#store";
import type { DatabaseService, Logger, StorageService } from "#types";
import { OpenApiRouter } from "#utils/api-router";
import { parseErrorMessage, type CustomErrorParser } from "#utils/error";
import { getMimeType } from "#utils/mime-utils";
import * as openapiRoutes from "./openapi";
import * as rootRoutes from "./root";
import * as serveRoutes from "./serve";

export interface RouterContext {
  database: DatabaseService;
  logger: Logger;
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

export async function router(
  request: Request,
  context: RouterContext,
): Promise<Response> {
  const { logger, prefix, customErrorParser, staticDirs } = context;

  try {
    const response = await localStore.run(
      {
        checkPermissions: () => true,
        customErrorParser,
        database: context.database,
        headless: !!context.headless,
        logger,
        prefix,
        request,
        storage: context.storage,
      },
      () => openApiRouter.handleRequest(request),
    );

    if (response) {
      return response;
    }

    const { pathname } = new URL(request.url);
    const filepath = pathname.replace(prefix, "");
    return handleStaticFileRoute(filepath, staticDirs, logger);
  } catch (error) {
    return new Response(parseErrorMessage(error).errorMessage, { status: 500 });
  }
}

function handleStaticFileRoute(
  filepath: string,
  staticDirs: readonly string[],
  logger: Logger,
): Response {
  logger.log(
    "Serving static file '%s' from '%s' dirs...",
    filepath,
    staticDirs.join(","),
  );

  const staticFilepaths = staticDirs.map((dir) =>
    path.join(path.relative(process.cwd(), dir), filepath),
  );

  const staticFilepath = staticFilepaths.find(fs.existsSync);
  if (!staticFilepath) {
    return new Response(`[${SERVICE_NAME}] No matching route or static file.`, {
      status: 404,
    });
  }

  logger.debug?.("Static file '%s' found.", staticFilepath);

  const stream = fs.createReadStream(staticFilepath, {
    autoClose: true,
    encoding: "utf8",
  });

  return new Response(Readable.toWeb(stream) as BodyInit, {
    headers: {
      "Cache-Control": CACHE_CONTROL_PUBLIC_WEEK,
      "Content-Type": getMimeType(staticFilepath) || "application/octet-stream",
    },
    status: 200,
  });
}
