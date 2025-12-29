// oxlint-disable max-params

import { getMimeType } from "hono/utils/mime";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { SERVICE_NAME } from "storybooker/_internal/constants";
import { icons } from "../icons/_icons.ts";
import { generateGlobalStyleSheet } from "../styles/global-style.ts";
import type { BrandTheme } from "../styles/theme.ts";
import { ASSETS, CACHE_CONTROL_PUBLIC_WEEK } from "../utils/constants.ts";
import { getUIStore } from "../utils/ui-store.ts";

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
        "content-type": "text/css",
      }),
      status: 200,
    });
  }

  if (filepath.startsWith(ASSETS.globalSprite)) {
    return generateGlobalSpriteResponse();
  }

  // Check FS for static file

  const staticFilepaths = staticDirs.map((dir) =>
    path.join(path.relative(process.cwd(), dir), filepath),
  );

  const staticFilepath = staticFilepaths.find((path) => fs.existsSync(path));
  if (!staticFilepath) {
    return new Response(`[${SERVICE_NAME}] Matching route not found.`, { status: 404 });
  }

  const contentType = getMimeType(staticFilepath) ?? "application/octet-stream";
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

function generateGlobalSpriteResponse(): Response {
  const symbols = Object.entries(icons).map(([name, icon]) => {
    let symbol = String(icon)
      .replace("<svg", `<symbol id="${name}"`)
      .replace("</svg>", "</symbol>");

    if (!symbol.includes("fill=")) {
      symbol = symbol.replace("<symbol ", `<symbol fill="currentColor" `);
    }
    if (symbol.includes(" width=")) {
      symbol = symbol.replace(/width="[^"]*"/, "");
    }
    if (symbol.includes(" height=")) {
      symbol = symbol.replace(/height="[^"]*"/, "");
    }

    return symbol;
  });

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    ${symbols.join("\n")}
  </defs>
</svg>`,
    {
      headers: new Headers({
        "cache-control": CACHE_CONTROL_PUBLIC_WEEK,
        "content-type": "image/svg+xml",
      }),
      status: 200,
    },
  );
}
