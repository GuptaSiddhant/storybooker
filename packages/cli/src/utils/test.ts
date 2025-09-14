// oxlint-disable require-await
// oxlint-disable max-lines-per-function

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { detectPackageManager } from "../utils/pkg-utils";

export function testStoryBook({
  test,
  cwd,
  silent,
  testReportDir = ".test/report",
  testCoverageDir = ".test/coverage",
}: {
  test: string | boolean | undefined;
  cwd: string;
  silent?: boolean;
  testReportDir?: string;
  testCoverageDir?: string;
}): {
  testCoverageDirpath: string | undefined;
  testReportDirpath: string | undefined;
} {
  if (test) {
    try {
      runTest(test, { cwd, silent, testCoverageDir, testReportDir });
    } catch (error) {
      console.error(error);
    }
  } else {
    console.log("> Skipping tests");
  }

  const testReportDirpath = path.join(cwd, testReportDir);
  const existsTestReportDirpath = fs.existsSync(testReportDirpath);

  if (existsTestReportDirpath) {
    console.log(
      "> Test report saved at '%s'.",
      path.relative(cwd, testReportDirpath),
    );
  } else {
    console.warn("> Test report was not created'.");
  }

  const testCoverageDirpath = path.join(cwd, testCoverageDir);
  const existsTestCoverageDirpath = fs.existsSync(testCoverageDirpath);
  if (existsTestCoverageDirpath) {
    console.log(
      "> Test coverage saved at '%s'.",
      path.relative(cwd, testCoverageDirpath),
    );
  } else {
    console.warn("> Test coverage was not created'.");
  }

  return {
    testCoverageDirpath: existsTestCoverageDirpath
      ? testCoverageDirpath
      : undefined,
    testReportDirpath: existsTestReportDirpath ? testReportDirpath : undefined,
  };
}

function runTest(
  test: string | true,
  options: {
    cwd: string;
    silent?: boolean;
    testReportDir: string;
    testCoverageDir: string;
  },
): void {
  const { cwd, silent, testCoverageDir, testReportDir } = options;
  if (typeof test === "string" && test.trim() !== "") {
    console.log("> Testing StoryBook with script: %s", test);
    const pkgManager = detectPackageManager(cwd);
    spawnSync(pkgManager, ["run", test], {
      cwd,
      shell: true,
      stdio: silent ? undefined : "inherit",
    });
    return;
  }

  console.log("> Testing StoryBook with Vitest");
  spawnSync(
    "npx",
    [
      "-y",
      "vitest",
      "run",
      // "--silent=passed-only",
      "--reporter=default",
      "--reporter=html",
      `--outputFile.html=${path.join(testReportDir, "index.html")}`,
      "--reporter=json",
      `--outputFile.json=${path.join(testReportDir, "report.json")}`,
      "--coverage",
      "--coverage.provider=v8",
      "--coverage.reportOnFailure",
      `--coverage.reportsDirectory=${testCoverageDir}`,
      "--coverage.reporter=text",
      "--coverage.reporter=html",
      "--coverage.reporter=text-summary",
      "--coverage.reporter=json-summary",
    ],
    {
      cwd,
      stdio: silent ? undefined : "inherit",
    },
  );
  return;
}
