import z from "zod";
import { sharedSchemas } from "../utils/schema-utils";

export type CreateSchemaInputs = z.infer<typeof CreateSchema>;
export const CreateSchema = z.object({
  project: sharedSchemas.project,
  url: sharedSchemas.url,
  cwd: sharedSchemas.cwd,
  sha: z.string({ error: "URL is required to connect to the service." }).meta({
    alias: ["id"],
    description: "Unique ID of the build.",
  }),
  message: z
    .string()
    .optional()
    .meta({ alias: ["m"], description: "Readable message for the build." }),
  labels: z
    .string()
    .array()
    .meta({
      alias: ["l"],
      description: "Labels associated with the build.",
    }),
  build: z
    .union([z.string(), z.boolean()])
    .optional()
    .meta({
      alias: ["b"],
      description: "Name of the script in package.json to build the StoryBook.",
    }),
  test: z
    .union([z.string(), z.boolean()])
    .optional()
    .meta({
      alias: ["t"],
      description: "Name of the script in package.json to test the StoryBook.",
    }),
  testCoverageDir: sharedSchemas.testCoverageDir,
  testReportDir: sharedSchemas.testReportDir,
  silent: z
    .boolean()
    .default(false)
    .meta({
      alias: ["s"],
      description: "Silent the logs and only show final error/status.",
    }),
  authorName: z.string().optional().meta({
    description: "Name of the author of the build.",
  }),
  authorEmail: z.email().optional().meta({
    description: "Email of the author of the build.",
  }),
  ignoreError: z.boolean().default(false).meta({
    hidden: true,
  }),
});
