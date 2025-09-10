import z from "zod";

export type CreateSchemaInputs = z.infer<typeof CreateSchema>;
export const CreateSchema = z.object({
  project: z
    .string({ error: "ProjectID is required to match with project." })
    .meta({
      alias: ["p"],
      description: "Project ID associated with the StoryBook.",
    }),
  url: z.url({ error: "URL is required to connect to the service." }).meta({
    alias: ["u"],
    description: "URL of the StoryBooker service.",
  }),
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
  cwd: z
    .string()
    .optional()
    .meta({ description: "Change the working directory for the command." }),
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
  testReportDir: z.string().optional().meta({
    description: "Relative path of the test report directory to upload.",
  }),
  testCoverageDir: z.string().optional().meta({
    description: "Relative path of the test coverage directory to upload.",
  }),
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
  ignoreError: z.boolean().default(false),
});
