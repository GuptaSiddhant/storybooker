import * as fs from "node:fs";
import * as path from "node:path";
import { styleText } from "node:util";
import createClient from "openapi-fetch";
import type { CommandModule } from "yargs";
import z from "zod";
import type { paths } from "../service-schema";
import { buildStoryBook } from "../utils/build";
import { zodSchemaToCommandBuilder } from "../utils/schema-utils";
import { testStoryBook } from "../utils/test";
import { CreateSchema } from "./create-schema";
import { createSBRBuild, uploadSBRBuild } from "./create-service";

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

    const cwd = result.data.cwd ? path.resolve(result.data.cwd) : process.cwd();
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
    } = result.data;

    const client = createClient<paths>({ baseUrl: url });

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
