import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import {
  CACHE_CONTROL_PUBLIC_WEEK,
  CONTENT_TYPES,
  DEFAULT_STATIC_DIRS,
  SERVICE_NAME,
} from "#constants";
import { getStore } from "#store";
import { authenticateOrThrow } from "#utils/auth";
import { getMimeType } from "#utils/mime-utils";

export async function handleStaticFileRoute(
  staticDirs: readonly string[] = DEFAULT_STATIC_DIRS,
): Promise<Response> {
  const { logger, prefix, url } = getStore();
  const { pathname } = new URL(url);
  const filepath = pathname.replace(prefix, "");

  await authenticateOrThrow({
    action: "read",
    projectId: undefined,
    resource: "ui",
  });

  const staticFilepaths = staticDirs.map((dir) =>
    path.join(path.relative(process.cwd(), dir), filepath),
  );

  const staticFilepath = staticFilepaths.find(fs.existsSync);
  if (!staticFilepath) {
    return new Response(`[${SERVICE_NAME}] No matching route or static file.`, {
      status: 404,
    });
  }

  logger.log("Serving static file '%s' found.", staticFilepath);

  const content = await fsp.readFile(staticFilepath, {
    encoding: "utf8",
  });

  return new Response(content, {
    headers: {
      "Cache-Control": CACHE_CONTROL_PUBLIC_WEEK,
      "Content-Type": getMimeType(staticFilepath) || CONTENT_TYPES.OCTET,
    },
    status: 200,
  });
}
