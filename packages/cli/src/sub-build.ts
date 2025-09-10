import * as fs from "node:fs";
import * as path from "node:path";
import { detectPackageManager, spawnPromise } from "./utils";

export async function buildStoryBook({
  build,
  cwd,
  silent,
}: {
  build?: string | boolean;
  cwd: string;
  silent?: boolean;
}): Promise<string | undefined> {
  if (build === false) {
    console.log("> Skipping StoryBook Build.");
    return;
  }

  let output = "";
  if (typeof build === "string" && build.trim() !== "") {
    console.log("> Building StoryBook with script: %s", build);
    const pkgManager = detectPackageManager(cwd);
    output = await spawnPromise(pkgManager, ["run", build], {
      cwd,
      shell: true,
      stdio: silent ? undefined : "pipe",
    });
  } else {
    console.log("> Building StoryBook with storybook CLI");
    output = await spawnPromise("npx", ["-y", "storybook", "build"], {
      cwd,
      stdio: silent ? undefined : "pipe",
    });
  }

  if (!output) {
    throw new Error(`No build output: ${output}`);
  }

  const outputDirpath =
    output.split("Output directory: ").at(1)?.trim() ||
    path.join(cwd, "storybook-static");

  if (!fs.existsSync(outputDirpath)) {
    throw new Error(`Could not find build output at '${outputDirpath}'.`);
  }

  console.log(
    "> Built StoryBook to dir: '%s'.",
    path.relative(cwd, outputDirpath),
  );
  return outputDirpath;
}
