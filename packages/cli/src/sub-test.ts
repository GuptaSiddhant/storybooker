// oxlint-disable max-lines-per-function

import * as fs from "node:fs";
import * as path from "node:path";
import { detectPackageManager, spawnPromise } from "./utils";

export async function testStoryBook({
  test,
  cwd,
  silent,
  testReportDir = "test-report",
  testCoverageDir = "coverage",
}: {
  test: string | true;
  cwd: string;
  silent?: boolean;
  testReportDir?: string;
  testCoverageDir?: string;
}): Promise<{
  testCoverageDirpath: string | undefined;
  testReportDirpath: string | undefined;
}> {
  if (typeof test === "string" && test.trim() !== "") {
    console.log("> Testing StoryBook with script: %s", test);
    const pkgManager = detectPackageManager(cwd);
    await spawnPromise(pkgManager, ["run", test], {
      cwd,
      shell: true,
      stdio: silent ? undefined : "pipe",
    }).catch(() => {
      // ignore error
    });
  } else {
    console.log("> Testing StoryBook with Vitest");
    await spawnPromise(
      "npx",
      [
        "-y",
        "vitest",
        "run",
        "--silent=passed-only",
        "--reporter=default",
        "--reporter=html",
        `--outputFile.html=${path.join(testReportDir, "index.html")}`,
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
        stdio: silent ? undefined : "pipe",
      },
    ).catch(() => {
      // ignore error
    });
  }

  const testReportDirpath = path.join(cwd, testReportDir);
  const testCoverageDirpath = path.join(cwd, testCoverageDir);

  const existsTestReportDirpath = fs.existsSync(testReportDirpath);
  const existsTestCoverageDirpath = fs.existsSync(testCoverageDirpath);

  if (existsTestReportDirpath) {
    console.log(
      "> Test report saved at '%s'.",
      path.relative(cwd, testReportDirpath),
    );
  } else {
    console.warn("> Test report was not created'.");
  }

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
