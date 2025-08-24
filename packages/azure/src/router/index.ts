import type { AnyRouter } from "@orpc/server";
import planets, { PlanetSchema } from "./planets";
import type { OpenAPIGeneratorGenerateOptions } from "@orpc/openapi";

export const router = {
  planets,
} satisfies AnyRouter;

export const commonSchemas: OpenAPIGeneratorGenerateOptions["commonSchemas"] = {
  Planet: { schema: PlanetSchema },
};
