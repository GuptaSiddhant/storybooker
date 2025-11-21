import z from "zod";
import { PATTERNS } from "../utils/constants";

export const TagSlugSchema = z
  .string()
  .meta({ description: "The slug of the tag.", id: "TagID" });

export const BuildSHASchema = z
  .string()
  .check(z.minLength(7))
  .meta({ description: "The SHA of the build.", id: "BuildID" });

export const ProjectIdSchema = z
  .string()
  .refine(
    (val) => new RegExp(PATTERNS.projectId.pattern).test(val),
    PATTERNS.projectId.message,
  )
  .meta({ description: "The ID of the project.", id: "ProjectID" });
