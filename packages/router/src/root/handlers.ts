import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import {
  CACHE_CONTROL_PUBLIC_WEEK,
  CONTENT_TYPES,
  SERVICE_NAME,
} from "#constants";
import { authenticateOrThrow } from "#utils/auth";
import { getMimeType } from "#utils/mime-utils";
import type { Logger } from "../types";

export async function handleStaticFileRoute(
  filepath: string,
  staticDirs: readonly string[],
  logger: Logger,
): Promise<Response> {
  await authenticateOrThrow([
    { action: "read", projectId: undefined, resource: "ui" },
  ]);

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
      "Content-Type": getMimeType(staticFilepath) || CONTENT_TYPES.OCTET,
    },
    status: 200,
  });
}
