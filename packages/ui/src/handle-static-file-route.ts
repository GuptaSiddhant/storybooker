// oxlint-disable max-params

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { SuperHeaders } from "@remix-run/headers";
import { SERVICE_NAME } from "@storybooker/core/constants";
import { getMimeType, mimes } from "@storybooker/core/mimes";
import { getStore } from "@storybooker/core/store";
import { generateGlobalSprite } from "./icons/global-sprite";
import { generateGlobalScript } from "./scripts/global-script";
import { generateGlobalStyleSheet } from "./styles/global-style";
import { ASSETS, CACHE_CONTROL_PUBLIC_WEEK } from "./utils/constants";
import type { BrandTheme } from "./utils/types";

export async function handleStaticFileRoute(
  filepath: string,
  theme: { darkTheme: BrandTheme; lightTheme: BrandTheme },
  staticDirs: readonly string[],
): Promise<Response> {
  const { logger } = getStore();

  if (filepath.startsWith(`/${ASSETS.globalStyles}`)) {
    const stylesheet = generateGlobalStyleSheet(theme);

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
    return new Response(`[${SERVICE_NAME}] Matching route not found.`, {
      status: 404,
    });
  }

  const contentType = getMimeType(staticFilepath);

  logger.log(
    "%s: '%s' (%s)",
    "Serving static file from disk.",
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
