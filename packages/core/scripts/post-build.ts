import type { OpenAPIHono } from "@hono/zod-openapi";
import type { ResolvedConfig } from "tsdown";
import { updateDenoJsonToMatchPkgJson } from "../../../scripts/jsr-utils.ts";
import { generateOpenApiSpecFiles } from "./gen-openapi-spec-files.ts";

export async function postBuildSuccess(config: ResolvedConfig): Promise<void> {
  try {
    const { appRouter, openapiConfig } = await import("../dist/router.mjs");
    await generateOpenApiSpecFiles(
      config,
      (appRouter as OpenAPIHono).getOpenAPI31Document(openapiConfig),
    );
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.error("Failed to generate OpenAPI spec files:", error);
  }

  await updateDenoJsonToMatchPkgJson(config);
}
