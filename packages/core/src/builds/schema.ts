// oxlint-disable sort-keys

import z from "zod";
import { BuildSHASchema, TagSlugSchema } from "../utils/shared-model";

const buildContentAvailabilityOptions = ["none", "uploaded", "ready"] as const;

export type BuildType = z.infer<typeof BuildSchema>;
/** @private */
export const BuildSchema = z
  .object({
    authorEmail: z
      .string()
      .refine((val) => val.includes("@"), "Invalid email format")
      .meta({ description: "Email of the author" }),
    authorName: z.string(),
    createdAt: z.iso.datetime().default(new Date().toISOString()),
    id: BuildSHASchema,
    tagSlugs: z.string(),
    message: z.optional(z.string()),
    sha: BuildSHASchema,
    updatedAt: z.iso.datetime().default(new Date().toISOString()),
    coverage: z.enum(buildContentAvailabilityOptions),
    screenshots: z.enum(buildContentAvailabilityOptions),
    storybook: z.enum(buildContentAvailabilityOptions),
    testReport: z.enum(buildContentAvailabilityOptions),
  })
  .meta({ id: "build", title: "StoryBooker Build" });

export type BuildCreateType = z.infer<typeof BuildCreateSchema>;
/** @private */
export const BuildCreateSchema = BuildSchema.omit({
  createdAt: true,
  coverage: true,
  screenshots: true,
  storybook: true,
  testReport: true,
  id: true,
  tagSlugs: true,
  updatedAt: true,
}).extend({
  tags: z.union([TagSlugSchema.array(), TagSlugSchema]).meta({
    description:
      "Tag slugs associated with the build. Should be created beforehand.",
  }),
});

export type BuildUpdateType = z.infer<typeof BuildUpdateSchema>;
export const BuildUpdateSchema = BuildSchema.omit({
  createdAt: true,
  id: true,
  sha: true,
  updatedAt: true,
}).partial();

export const buildUploadVariants = [
  "storybook",
  "testReport",
  "coverage",
  "screenshots",
] as const;
export type BuildUploadVariant = (typeof buildUploadVariants)[number];
export const BuildUploadQueryParamsSchema = z.object({
  variant: z.enum(buildUploadVariants).default("storybook"),
});
export const BuildUploadFormBodySchema = z.object({
  file: z.file(),
  variant: z.enum(buildUploadVariants).default("storybook"),
});

export type BuildsListResultType = z.infer<typeof BuildsListResultSchema>;
export const BuildsListResultSchema = z.object({
  builds: BuildSchema.array(),
});
export type BuildsGetResultType = z.infer<typeof BuildsGetResultSchema>;
export const BuildsGetResultSchema = z.object({
  build: BuildSchema,
  url: z.url(),
});

export type BuildStoryType = z.infer<typeof BuildStorySchema>;
export const BuildStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  name: z.string(),
  importPath: z.string(),
  tags: z.array(z.string()),
  type: z.enum(["docs", "story"]),
  componentPath: z.string().optional(),
  storiesImports: z.array(z.string()).optional(),
});
