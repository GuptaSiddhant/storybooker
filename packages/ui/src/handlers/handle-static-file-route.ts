// oxlint-disable max-params

import { SERVICE_NAME } from "@storybooker/core/constants";
import { getMimeType, mimes } from "@storybooker/core/mimes";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { generateGlobalSprite } from "../icons/global-sprite";
import { generateGlobalScript } from "../scripts/global-script";
import { generateGlobalStyleSheet } from "../styles/global-style";
import type { BrandTheme } from "../styles/theme";
import { ASSETS, CACHE_CONTROL_PUBLIC_WEEK } from "../utils/constants";
import { getUIStore } from "../utils/ui-store";

export async function handleStaticFileRoute(
  filepath: string,
  options: {
    darkTheme: BrandTheme;
    lightTheme: BrandTheme;
    staticDirs: readonly string[];
  },
): Promise<Response> {
  const { darkTheme, lightTheme, staticDirs } = options;
  const { logger } = getUIStore();

  if (filepath.startsWith(ASSETS.globalStyles)) {
    return new Response(generateGlobalStyleSheet({ darkTheme, lightTheme }), {
      headers: new Headers({
        "cache-control": CACHE_CONTROL_PUBLIC_WEEK,
        "content-type": mimes.css,
      }),
      status: 200,
    });
  }

  if (filepath.startsWith(ASSETS.globalScript)) {
    return new Response(generateGlobalScript(), {
      headers: new Headers({
        "cache-control": CACHE_CONTROL_PUBLIC_WEEK,
        "content-type": mimes.js,
      }),
      status: 200,
    });
  }

  if (filepath.startsWith(ASSETS.globalSprite)) {
    return new Response(generateGlobalSprite(), {
      headers: new Headers({
        "cache-control": CACHE_CONTROL_PUBLIC_WEEK,
        "content-type": mimes.svg,
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
    return new Response(`[${SERVICE_NAME}] Matching route not found.`, { status: 404 });
  }

  const contentType = getMimeType(staticFilepath);

  logger.log("%s: '%s' (%s)", "Serving static file from disk.", staticFilepath, contentType);

  const fileHandle = await fsp.open(staticFilepath, "r");
  const nodeStream = fileHandle.createReadStream();
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  const headers = new Headers({
    "cache-control": CACHE_CONTROL_PUBLIC_WEEK,
    "content-type": contentType,
  });

  return new Response(webStream, { headers, status: 200 });
}
