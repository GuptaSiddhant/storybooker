// oxlint-disable no-console

import fs from "node:fs";
import { checkJsrRepublish } from "./jsr-utils.ts";

const path = import.meta.resolve("../packages/core/deno.json");
const { default: data } = await import(path, { with: { type: "json" } });
const { name, version } = data;

const published = await checkJsrRepublish(name, version);

if (published) {
  console.log(`Pkg ${name}@${version} is already published to JSR.`);
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `isJsrPublished=true\n`);
  } else {
    console.error("GitHub output is not specified.");
  }
} else {
  console.log(`Pkg ${name}@${version} is not published to JSR.`);
}
