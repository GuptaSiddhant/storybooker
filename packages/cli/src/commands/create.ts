// oxlint-disable new-cap
// oxlint-disable max-lines-per-function

import * as fs from "node:fs";
import * as path from "node:path";
import { styleText } from "node:util";
import createClient from "openapi-fetch";
import type { CommandModule } from "yargs";
import z from "zod";
import type { paths } from "../service-schema";
import { createAuthMiddleware } from "../utils/auth-utils.ts";
import { buildStoryBook } from "../utils/sb-build";
import { testStoryBook } from "../utils/sb-test";
import { sharedSchemas, zodSchemaToCommandBuilder } from "../utils/schema-utils.ts";
import { toReadableStream } from "../utils/stream-utils.ts";
import type { ServiceClient } from "../utils/types";
import { zip } from "../utils/zip";

const CreateSchema = z.object({
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
  authType: sharedSchemas.authType,
  authValue: sharedSchemas.authValue,
});

export const createCommandModule: CommandModule = {
  command: "create",
  describe: "Create and upload StoryBook assets to the service.",
  builder: zodSchemaToCommandBuilder(CreateSchema),
  // oxlint-disable-next-line max-lines-per-function
  handler: async (args): Promise<void> => {
    const result = CreateSchema.safeParse(args);
    if (!result.success) {
      throw new Error(z.prettifyError(result.error));
    }

    const cwd =
      result.data.cwd !== undefined && result.data.cwd !== ""
        ? path.resolve(result.data.cwd)
        : process.cwd();
    if (cwd && !fs.existsSync(cwd)) {
      throw new Error(`Path provided to CWD does not exists: '${cwd}'`);
    }

    const {
      build,
      silent,
      url,
      project,
      sha,
      ignoreError,
      test,
      testCoverageDir,
      testReportDir,
      authType,
      authValue,
    } = result.data;

    const client = createClient<paths>({ baseUrl: url });
    client.use(createAuthMiddleware({ authType, authValue }));

    try {
      console.group(styleText("bold", "\nCreate Build Entry"));
      await createSBRBuild(client, result.data, ignoreError);
      console.groupEnd();

      console.group(styleText("bold", "\nBuild StoryBook"));
      const buildDirpath = buildStoryBook({ build, cwd, silent });
      if (buildDirpath) {
        await uploadSBRBuild(client, {
          project,
          sha,
          dirpath: buildDirpath,
          variant: "storybook",
          cwd,
        });
        console.groupEnd();
      }

      console.group(styleText("bold", "\nTest StoryBook"));
      const { testCoverageDirpath, testReportDirpath } = testStoryBook({
        cwd,
        test,
        silent,
        testCoverageDir,
        testReportDir,
      });

      if (testReportDirpath) {
        await uploadSBRBuild(client, {
          project,
          sha,
          dirpath: testReportDirpath,
          cwd,
          variant: "testReport",
        });
      }
      if (testCoverageDirpath) {
        await uploadSBRBuild(client, {
          project,
          sha,
          dirpath: testCoverageDirpath,
          cwd,
          variant: "coverage",
        });
      }
      console.groupEnd();

      console.log(styleText("green", "Created build successfully."));
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  },
};

async function createSBRBuild(
  client: ServiceClient,
  { project, sha, message, labels }: z.infer<typeof CreateSchema>,
  ignorePrevious?: boolean,
): Promise<void> {
  const { error, response } = await client.POST("/projects/{projectId}/builds/create", {
    params: { path: { projectId: project } },
    body: {
      authorEmail: "Siddhant@asd.com",
      authorName: "Siddhant",
      labels,
      sha,
      message,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (error) {
    if (ignorePrevious) {
      console.warn(styleText("yellow", "> StoryBooker Build entry already exits."));
    } else {
      throw new Error(
        error.errorMessage || `Request to service failed with status: ${response.status}.`,
      );
    }
  } else {
    console.log("New Build entry created '%s / %s'", project, sha);
  }
}

async function uploadSBRBuild(
  client: ServiceClient,
  {
    project,
    sha,
    dirpath,
    variant,
    cwd,
  }: {
    project: string;
    sha: string;
    dirpath: string;
    variant: "storybook" | "testReport" | "coverage" | "screenshots";
    cwd: string;
  },
): Promise<void> {
  const zipFilepath = path.join(cwd, `${variant}.zip`);

  console.log(
    `> Compressing directory '%s' to file '%s'...`,
    path.relative(cwd, dirpath),
    path.relative(cwd, zipFilepath),
  );
  zip(path.join(dirpath, "*"), zipFilepath);

  const fileSize = fs.statSync(zipFilepath).size;

  console.log(`> Uploading file '%s'...`, path.relative(cwd, zipFilepath));
  const { error, response } = await client.POST("/projects/{projectId}/builds/{buildSHA}/upload", {
    params: {
      path: { projectId: project, buildSHA: sha },
      query: { variant },
    },
    // @ts-expect-error assign stream to object
    body: toReadableStream(fs.createReadStream(zipFilepath), fileSize),
    bodySerializer: (body) => body,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/zip",
      "Content-Length": fileSize.toString(),
    },
    duplex: "half",
  });

  if (error) {
    throw new Error(
      error.errorMessage || `Request to service failed with status: ${response.status}.`,
    );
  } else {
    console.log("> Uploaded '%s / %s / %s'.", project, sha, variant);
    fs.rmSync(zipFilepath);
  }
}
