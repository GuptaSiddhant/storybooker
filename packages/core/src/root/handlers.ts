import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import {
  CACHE_CONTROL_PUBLIC_WEEK,
  CONTENT_TYPES,
  DEFAULT_STATIC_DIRS,
  HEADERS,
  SERVICE_NAME,
} from "#constants";
import { getStore } from "#store";
import { authenticateOrThrow } from "#utils/auth";
import { getMimeType } from "#utils/mime-utils";

export async function handleStaticFileRoute(
  staticDirs: readonly string[] = DEFAULT_STATIC_DIRS,
): Promise<Response> {
  const { logger, prefix, translation, url } = getStore();
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
    return new Response(
      `[${SERVICE_NAME}] ${translation.errorMessages.matching_round_not_found}.`,
      { status: 404 },
    );
  }

  logger.log(
    "%s: '%s'",
    translation.messages.serving_static_file,
    staticFilepath,
  );

  const content = await fsp.readFile(staticFilepath, { encoding: "binary" });

  return new Response(content, {
    headers: {
      [HEADERS.cacheControl]: CACHE_CONTROL_PUBLIC_WEEK,
      [HEADERS.contentType]: getMimeType(staticFilepath) || CONTENT_TYPES.OCTET,
    },
    status: 200,
  });
}
