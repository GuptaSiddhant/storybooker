import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { detectPackageManager } from "./pkg-utils";

export function buildStoryBook({
  build,
  cwd,
  silent,
}: {
  build?: string | boolean;
  cwd: string;
  silent?: boolean;
}): string | undefined {
  if (build === false) {
    console.log("> Skipping StoryBook Build.");
    return;
  }

  let output = "";
  if (typeof build === "string" && build.trim() !== "") {
    console.log("> Building StoryBook with script: %s", build);
    const pkgManager = detectPackageManager(cwd);
    output = spawnSync(pkgManager, ["run", build], {
      cwd,
      shell: true,
      stdio: silent ? undefined : "inherit",
      encoding: "utf8",
    }).stdout;
  } else {
    console.log("> Building StoryBook with storybook CLI");
    output = spawnSync("npx", ["-y", "storybook", "build"], {
      cwd,
      stdio: silent ? undefined : "inherit",
      encoding: "utf8",
    }).stdout;
  }

  const outputDirpath = output?.split("Output directory: ").at(1)?.trim();

  if (!outputDirpath || !fs.existsSync(outputDirpath)) {
    console.error(`Could not find build output at '${outputDirpath}'.`);
    return undefined;
  }

  console.log(
    "> Built StoryBook to dir: '%s'.",
    path.relative(cwd, outputDirpath),
  );
  return outputDirpath;
}
