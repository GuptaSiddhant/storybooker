import { z } from "zod";
import { DEFAULT_GITHUB_BRANCH, DEFAULT_PURGE_AFTER_DAYS } from "../utils/constants.ts";
import { BuildIdSchema, ProjectIdSchema } from "./~shared-schema.ts";

export { ProjectIdSchema };

export type ProjectType = z.infer<typeof ProjectSchema>;

export const ProjectSchema = z
  .object({
    createdAt: z.iso.datetime().default(new Date().toISOString()),

    gitHubDefaultBranch: z
      .string()
      .default(DEFAULT_GITHUB_BRANCH)
      .meta({ description: "Default branch to use for GitHub repository" }),
    gitHubPath: z.string().optional().meta({
      description: "Path to the storybook project with respect to repository root.",
    }),
    gitHubRepository: z.string().check(
      z.minLength(1, "Query-param 'gitHubRepo' is required."),
      z.refine(
        (val) => val.split("/").length === 2,
        "Query-param 'gitHubRepo' should be in the format 'owner/repo'.",
      ),
    ),

    id: ProjectIdSchema,

    jiraDomain: z.union([z.url().optional(), z.literal("")]),

    latestBuildId: z.union([BuildIdSchema.optional(), z.literal("")]),

    name: z.string().meta({ description: "Name of the project." }),

    purgeBuildsAfterDays: z.coerce.number().min(1).default(DEFAULT_PURGE_AFTER_DAYS).meta({
      description: "Days after which the builds in the project should be purged.",
    }),

    updatedAt: z.iso.datetime().default(new Date().toISOString()),
  })
  .meta({ id: "Project", title: "StoryBooker project" });

export type ProjectCreateType = z.infer<typeof ProjectCreateSchema>;
export const ProjectCreateSchema = ProjectSchema.omit({
  createdAt: true,
  latestBuildId: true,
  updatedAt: true,
});

export type ProjectUpdateType = z.infer<typeof ProjectUpdateSchema>;
export const ProjectUpdateSchema = ProjectSchema.omit({
  createdAt: true,
  gitHubDefaultBranch: true,
  id: true,
  updatedAt: true,
})
  .extend({ gitHubDefaultBranch: z.string() })
  .partial();

export type ProjectsListResultType = z.infer<typeof ProjectsListResultSchema>;
export const ProjectsListResultSchema = z.object({
  projects: ProjectSchema.array(),
});

export type ProjectGetResultType = z.infer<typeof ProjectGetResultSchema>;
export const ProjectGetResultSchema = z.object({
  project: ProjectSchema,
});
