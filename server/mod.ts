// oxlint-disable require-await

import type { RequestHandlerOptions } from "../packages/core/dist/index.d.ts";
import { createRequestHandler } from "../packages/core/dist/index.js";
import { FileDatabase } from "./database.ts";
import { LocalStorage } from "./storage.ts";

const options: RequestHandlerOptions = {
  auth: undefined,
  database: new FileDatabase(),
  staticDirs: ["./server"],
  storage: new LocalStorage(),
};

const handler = createRequestHandler(options);

export default { fetch: handler };
