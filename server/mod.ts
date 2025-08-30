import type { RouterContext } from "../packages/core/dist/index.d.ts";
import { createRequestHandler } from "../packages/core/dist/index.js";
import { FileDatabase } from "./database.ts";
import { LocalStorage } from "./storage.ts";

const context: RouterContext = {
  database: new FileDatabase(),
  staticDirs: ["./server"],
  storage: new LocalStorage(),
};

const handler = createRequestHandler(context);

export default { fetch: handler };
