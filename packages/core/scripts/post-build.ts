import type { OpenAPIHono } from "@hono/zod-openapi";
import type { ResolvedOptions } from "tsdown";
import { updateDenoJsonToMatchPkgJson } from "../../../scripts/jsr-utils.ts";
import { generateOpenApiSpecFiles } from "./gen-openapi-spec-files.ts";

export async function postBuildSuccess(config: ResolvedOptions): Promise<void> {
  const { appRouter, openapiConfig } = await import("../dist/router.js");
  await generateOpenApiSpecFiles(
    config,
    (appRouter as OpenAPIHono).getOpenAPI31Document(openapiConfig),
  );

  await updateDenoJsonToMatchPkgJson(config);
}
