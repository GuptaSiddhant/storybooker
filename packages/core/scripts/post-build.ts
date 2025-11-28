import type { OpenAPIHono } from "@hono/zod-openapi";
import type { ResolvedOptions } from "tsdown";
import { updateDenoJsonToMatchPkgJson } from "../../../scripts/jsr-utils.ts";
import { generateOpenApiSpecFiles } from "./gen-openapi-spec-files.ts";

export async function postBuildSuccess(config: ResolvedOptions): Promise<void> {
  const { appRouter } = await import("../dist/router.js");
  const { SERVICE_NAME } = await import("../dist/index.js");
  const pkgJson = await import("../package.json", { with: { type: "json" } });

  await generateOpenApiSpecFiles(
    config,
    (appRouter as OpenAPIHono).getOpenAPI31Document({
      info: { title: SERVICE_NAME, version: pkgJson.default.version },
      openapi: "3.1.0",
    }),
  );

  await updateDenoJsonToMatchPkgJson(config);
}
