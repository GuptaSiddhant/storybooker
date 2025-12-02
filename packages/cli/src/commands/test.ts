import * as fs from "node:fs";
import * as path from "node:path";
import { styleText } from "node:util";
import type { CommandModule } from "yargs";
import z from "zod";
import { testStoryBook } from "../utils/sb-test";
import { sharedSchemas, zodSchemaToCommandBuilder } from "../utils/schema-utils";

const schema = z.object({
  cwd: sharedSchemas.cwd,
  testCoverageDir: sharedSchemas.testCoverageDir,
  testReportDir: sharedSchemas.testReportDir,
});

export const testCommandModule: CommandModule = {
  command: "test",
  describe: "Run test on StoryBook with Vitest",
  builder: zodSchemaToCommandBuilder(schema),
  handler(args) {
    const result = schema.safeParse(args);
    if (!result.success) {
      throw new Error(z.prettifyError(result.error));
    }

    const cwd = result.data.cwd ? path.resolve(result.data.cwd) : process.cwd();
    if (cwd && !fs.existsSync(cwd)) {
      throw new Error(`Path provided to CWD does not exists: '${cwd}'`);
    }

    console.group(styleText("bold", "\nTest StoryBook"));
    testStoryBook({
      cwd,
      test: true,
      testCoverageDir: result.data.testCoverageDir,
      testReportDir: result.data.testReportDir,
    });
    console.groupEnd();
  },
};
