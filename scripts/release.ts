// oxlint-disable no-console
// oxlint-disable prefer-template

import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  allowNegative: true,
  allowPositionals: true,
  options: {
    message: { short: "m", type: "string" },
    tag: { default: true, type: "boolean" },
    version: { short: "v", type: "string" },
  },
});

const version = values.version || positionals[0];

if (!version) {
  throw new Error("A version is required.");
}
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`The version is ill-formatted (${version}).`);
}

const verifySpawn = cp.spawnSync(`yarn`, ["verify"], {
  encoding: "utf8",
  stdio: "inherit",
});

if (verifySpawn.status !== 0) {
  throw new Error("Verification failed!");
}

const packages = fs
  .readdirSync("./packages/", { withFileTypes: true })
  .filter((entry) => {
    if (!entry.isDirectory()) {
      return false;
    }
    const pkgJsonPath = path.join(entry.parentPath, entry.name, "package.json");
    return fs.existsSync(pkgJsonPath);
  })
  .map((entry) => {
    const fullPath = path.join(entry.parentPath, entry.name);
    const pkgJsonPath = path.join(fullPath, "package.json");
    const denoJsonPath = path.join(fullPath, "deno.json");

    return {
      denoJsonPath: fs.existsSync(denoJsonPath) ? denoJsonPath : undefined,
      name: entry.name,
      path: fullPath,
      pkgJsonPath,
    };
  });

for (const pkg of packages) {
  console.log("Updating pkg '%s' with version '%s'", pkg.name, version);

  const pkgJson = JSON.parse(
    fs.readFileSync(pkg.pkgJsonPath, { encoding: "utf8" }),
  );
  pkgJson["version"] = version;
  fs.writeFileSync(pkg.pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n", {
    encoding: "utf8",
  });

  if (pkg.denoJsonPath) {
    const denoJson = JSON.parse(
      fs.readFileSync(pkg.denoJsonPath, { encoding: "utf8" }),
    );
    denoJson["version"] = version;
    fs.writeFileSync(
      pkg.denoJsonPath,
      JSON.stringify(denoJson, null, 2) + "\n",
      {
        encoding: "utf8",
      },
    );
  }
}

if (values.tag) {
  console.group(`Releasing v${version}`);
  cp.execSync(`git add -A`, { encoding: "utf8" });
  console.log("Committing all changes...");
  cp.execSync(`git commit -m "release: v${version}\n${values.message || ""}"`, {
    encoding: "utf8",
  });
  console.log("Tagging version...");
  cp.execSync(`git tag "v${version}" -am "Version ${version}"`, {
    encoding: "utf8",
  });
  console.log("Pushing to origin...");
  cp.execSync(`git push --follow-tags`, { encoding: "utf8" });
  console.groupEnd();
}
