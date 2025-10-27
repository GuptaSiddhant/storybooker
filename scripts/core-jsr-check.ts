// oxlint-disable no-console

import { checkJsrRepublish } from "./jsr-utils.ts";

const path = import.meta.resolve("../packages/core/deno.json");
const { default: data } = await import(path, { with: { type: "json" } });
const { name, version } = data;

const published = await checkJsrRepublish(name, version);

if (published) {
  throw new Error(`Pkg '${name}@${version}' is already published to JSR.`);
} else {
  console.log(`Pkg '${name}@${version}' is not published to JSR.`);
}
