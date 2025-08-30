import type { RouterContext } from "../packages/core/dist/index.d.ts";
import { createRequestHandler } from "../packages/core/dist/index.js";
import { FileDatabase } from "./database.ts";
import { LocalStorage } from "./storage.ts";

const context: RouterContext = {
  database: new FileDatabase(),
  headless: false,
  logger: console,
  prefix: "",
  staticDirs: ["./public"],
  storage: new LocalStorage(),
};

export default { fetch: createRequestHandler(context) };
