import { BuildSHASchema, LabelSlugSchema } from "#utils/shared-model";
import z from "zod";

export type BuildType = z.infer<typeof BuildSchema>;
/** @private */
export const BuildSchema = z.object({
  authorEmail: z
    .string()
    .refine((val) => val.includes("@"), "Invalid email format")
    .meta({ description: "Email of the author" }),
  authorName: z.string(),
  createdAt: z.iso.datetime().default(new Date().toISOString()),
  hasCoverage: z.boolean().default(false),
  hasScreenshots: z.boolean().default(false),
  hasStorybook: z.boolean().default(false),
  hasTestReport: z.boolean().default(false),
  id: BuildSHASchema,
  labelSlugs: z.string(),
  message: z.optional(z.string()),
  sha: BuildSHASchema,
  updatedAt: z.iso.datetime().default(new Date().toISOString()),
});

export type BuildCreateType = z.infer<typeof BuildCreateSchema>;
/** @private */
export const BuildCreateSchema = BuildSchema.omit({
  createdAt: true,
  hasCoverage: true,
  hasScreenshots: true,
  hasStorybook: true,
  hasTestReport: true,
  labelSlugs: true,
  updatedAt: true,
}).extend({
  labels: LabelSlugSchema.array().meta({
    description:
      "Label slugs associated with the build. Should be created beforehand.",
  }),
});

export type BuildUpdateType = z.infer<typeof BuildUpdateSchema>;
export const BuildUpdateSchema = BuildSchema.omit({
  createdAt: true,
  id: true,
  sha: true,
  updatedAt: true,
}).partial();

export type BuildUploadVariant = z.infer<
  typeof BuildUploadQueryParamsSchema
>["variant"];
export const BuildUploadQueryParamsSchema = z.object({
  variant: z
    .enum(["storybook", "testReport", "coverage", "screenshots"])
    .default("storybook"),
});

export const BuildUploadFormSchema = z.object({ file: z.file() });

export type BuildsListResultType = z.infer<typeof BuildsListResultSchema>;
export const BuildsListResultSchema = z.object({
  builds: BuildSchema.array(),
});
export type BuildsGetResultType = z.infer<typeof BuildsGetResultSchema>;
export const BuildsGetResultSchema = z.object({
  build: BuildSchema,
  url: z.url(),
});
