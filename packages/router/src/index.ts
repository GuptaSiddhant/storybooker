import { localStore } from "#store";
import type { Logger } from "#types";
import { OpenApiRouter } from "#utils/api-router";
import type { CustomErrorParser } from "#utils/error";
import * as rootRoutes from "./root";
import * as openapiRoutes from "./openapi";
import path from "node:path";
import fs from "node:fs";
import { CACHE_CONTROL_PUBLIC_WEEK, SERVICE_NAME } from "#constants";
import { getMimeType } from "#utils/mime-utils";
import { Readable } from "node:stream";

export interface RouterContext {
  logger: Logger;
  customErrorParser?: CustomErrorParser;
  prefix: string;
  headless: boolean | undefined;
  staticDirs: readonly string[];
}

const openApiRouter = new OpenApiRouter();
openApiRouter.register(rootRoutes.root);
openApiRouter.register(rootRoutes.health);
openApiRouter.registerGroup("openapi", openapiRoutes);

export async function router(
  request: Request,
  context: RouterContext,
): Promise<Response> {
  const { logger, prefix, customErrorParser, staticDirs } = context;

  const response = await localStore.run(
    {
      checkPermissions: () => true,
      customErrorParser,
      headless: !!context.headless,
      logger,
      prefix,
      request,
    },
    () => openApiRouter.handleRequest(request),
  );

  if (response) {
    return response;
  }

  const { pathname } = new URL(request.url);
  const filepath = pathname.replace(prefix, "");
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
