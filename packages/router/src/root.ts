import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import {
  CACHE_CONTROL_PUBLIC_WEEK,
  CONTENT_TYPES,
  SERVICE_NAME,
} from "#constants";
import { getStore } from "#store";
import { defineRoute } from "#utils/api-router";
import { getMimeType } from "#utils/mime-utils";
import {
  commonErrorResponses,
  responseHTML,
  responseRedirect,
} from "#utils/response";
import { urlJoin } from "#utils/url";
import type { Logger } from "./types";

export const root = defineRoute(
  "get",
  // oxlint-disable-next-line prefer-string-raw
  "/",
  {
    responses: {
      ...commonErrorResponses,
      200: {
        content: { [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" } },
        description: "Root endpoint",
      },
      303: {
        description: "Redirects to all projects",
        headers: {
          Location: {
            description: "The URL to redirect to",
            schema: { format: "uri", type: "string" },
          },
        },
      },
      400: null,
    },
    summary: "Homepage",
  },
  ({ params }) => {
    const { headless, prefix } = getStore();
    if (headless) {
      return responseRedirect(urlJoin(prefix, "projects"), 301);
    }

    return responseHTML(
      `<html><body><h1>Hello from Router!</h1><pre>${JSON.stringify(params)}<pre></body></html>`,
    );
  },
);

export const health = defineRoute(
  "get",
  "health",
  {
    responses: { 200: { description: "Service is healthy." } },
    summary: "Health check",
  },
  () => new Response("Service is Healthy", { status: 200 }),
);

export function handleStaticFileRoute(
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
      "Content-Type": getMimeType(staticFilepath) || CONTENT_TYPES.OCTET,
    },
    status: 200,
  });
}
