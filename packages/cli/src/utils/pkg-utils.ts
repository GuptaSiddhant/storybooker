import * as fs from "node:fs";
import * as path from "node:path";

export type PkgManager = "npm" | "yarn" | "pnpm" | "bun";
export function detectPackageManager(
  startDir: string = process.cwd(),
  maxDepth = 5,
): PkgManager {
  let currentDir = startDir;
  let depth = 0;

  while (depth < maxDepth) {
    if (fs.existsSync(path.join(currentDir, `yarn.lock`))) {
      return "yarn";
    }
    if (fs.existsSync(path.join(currentDir, `pnpm-lock.yaml`))) {
      return "pnpm";
    }
    if (fs.existsSync(path.join(currentDir, `package-lock.json`))) {
      return "npm";
    }
    if (fs.existsSync(path.join(currentDir, `bun.lock`))) {
      return "bun";
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  throw new Error("Package manager could not be determined.");
}
