import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { SuperHeaders } from "@remix-run/headers";
import { generateGlobalSprite } from "../ui/icons/global-sprite";
import { generateGlobalScript } from "../ui/scripts/global-script";
import { generateGlobalStyleSheet } from "../ui/styles/global-style";
import { authenticateOrThrow } from "../utils/auth";
import {
  ASSETS,
  CACHE_CONTROL_PUBLIC_WEEK,
  DEFAULT_STATIC_DIRS,
  SERVICE_NAME,
} from "../utils/constants";
import { getMimeType, mimes } from "../utils/mime-utils";
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

  if (filepath.startsWith(`/${ASSETS.globalStyles}`)) {
    const { darkTheme, lightTheme } = ui || {};
    const stylesheet = generateGlobalStyleSheet({ darkTheme, lightTheme });

    return new Response(stylesheet, {
      headers: new SuperHeaders({
        cacheControl: CACHE_CONTROL_PUBLIC_WEEK,
        contentType: mimes.css,
      }),
      status: 200,
    });
  }

  if (filepath.startsWith(`/${ASSETS.globalScript}`)) {
    const script = generateGlobalScript();

    return new Response(script, {
      headers: new SuperHeaders({
        cacheControl: CACHE_CONTROL_PUBLIC_WEEK,
        contentType: mimes.js,
      }),
      status: 200,
    });
  }

  if (filepath.startsWith(`/${ASSETS.globalSprite}`)) {
    const sprite = generateGlobalSprite();

    return new Response(sprite, {
      headers: new SuperHeaders({
        cacheControl: CACHE_CONTROL_PUBLIC_WEEK,
        contentType: mimes.svg,
      }),
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

  const contentType = getMimeType(staticFilepath);

  logger.log(
    "%s: '%s' (%s)",
    translation.messages.serving_static_file,
    staticFilepath,
    contentType,
  );

  const content = await fsp.readFile(staticFilepath);

  return new Response(new Uint8Array(content), {
    headers: new SuperHeaders({
      cacheControl: CACHE_CONTROL_PUBLIC_WEEK,
      contentType,
    }),
    status: 200,
  });
}
