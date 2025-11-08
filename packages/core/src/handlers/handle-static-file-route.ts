// oxlint-disable max-lines-per-function

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { globalStyleSheet } from "../components/_global";
import { globalScripts } from "../components/_scripts";
import { authenticateOrThrow } from "../utils/auth";
import {
  CACHE_CONTROL_PUBLIC_WEEK,
  CONTENT_TYPES,
  DEFAULT_STATIC_DIRS,
  HEADERS,
  SCRIPTS,
  SERVICE_NAME,
  STYLESHEETS,
} from "../utils/constants";
import { getMimeType } from "../utils/mime-utils";
import { getStore } from "../utils/store";

export async function handleStaticFileRoute(
  staticDirs: readonly string[] = DEFAULT_STATIC_DIRS,
): Promise<Response> {
  const { logger, prefix, translation, ui, url } = getStore();
  const { pathname } = new URL(url);
  const filepath =
    prefix && prefix !== "/" ? pathname.replace(prefix, "") : pathname;

  await authenticateOrThrow({
    action: "read",
    projectId: undefined,
    resource: "ui",
  });

  if (filepath.startsWith(`/${STYLESHEETS.globalStyles}`)) {
    const { darkTheme, lightTheme } = ui || {};
    const stylesheet = globalStyleSheet({ darkTheme, lightTheme });

    return new Response(stylesheet, {
      headers: {
        [HEADERS.cacheControl]: CACHE_CONTROL_PUBLIC_WEEK,
        [HEADERS.contentType]: CONTENT_TYPES.CSS,
      },
      status: 200,
    });
  }

  if (filepath.startsWith(`/${SCRIPTS.globalScript}`)) {
    const script = globalScripts();

    return new Response(script, {
      headers: {
        [HEADERS.cacheControl]: CACHE_CONTROL_PUBLIC_WEEK,
        [HEADERS.contentType]: CONTENT_TYPES.JS,
      },
      status: 200,
    });
  }

  // Check FS for static file

  const staticFilepaths = staticDirs.map((dir) =>
    path.join(path.relative(process.cwd(), dir), filepath),
  );

  const staticFilepath = staticFilepaths.find((path) => fs.existsSync(path));
  if (!staticFilepath) {
    return new Response(
      `[${SERVICE_NAME}] ${translation.errorMessages.matching_round_not_found}.`,
      { status: 404 },
    );
  }

  const contentType = getMimeType(staticFilepath) || CONTENT_TYPES.OCTET;

  logger.log(
    "%s: '%s' (%s)",
    translation.messages.serving_static_file,
    staticFilepath,
    contentType,
  );

  const content = await fsp.readFile(staticFilepath);

  return new Response(new Uint8Array(content), {
    headers: {
      [HEADERS.cacheControl]: CACHE_CONTROL_PUBLIC_WEEK,
      [HEADERS.contentType]: contentType,
    },
    status: 200,
  });
}
