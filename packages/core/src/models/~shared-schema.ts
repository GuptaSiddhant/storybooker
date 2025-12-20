import { z } from "@hono/zod-openapi";
import { PATTERNS } from "../utils/constants.ts";

export const TagIdSchema = z.string().meta({ description: "The ID of the tag.", id: "TagID" });

export const BuildIdSchema = z
  .string()
  .check(z.minLength(7))
  .meta({ description: "The ID of the build.", id: "BuildID" });

export const ProjectIdSchema = z
  .string()
  .refine((val) => new RegExp(PATTERNS.projectId.pattern).test(val), PATTERNS.projectId.message)
  .meta({ description: "The ID of the project.", id: "ProjectID" });
