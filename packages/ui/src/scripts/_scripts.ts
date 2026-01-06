// oxlint-disable ban-types
// oxlint-disable no-new-func
import { raw } from "hono/html";
// @ts-expect-error importing raw JS file to embed in generated scripts
import htmxProgressScript from "./htmx-progress-script.js?raw" with { type: "text" };

export const CLIENT_SCRIPTS = {
  htmxProgress: raw(htmxProgressScript),
} satisfies Record<string, string>;
