import type { RouterContext } from "../packages/core/dist/index.d.ts";
import { router } from "../packages/core/dist/index.js";
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

export default {
  async fetch(request: Request): Promise<Response> {
    return await router(request, context);
  },
};
