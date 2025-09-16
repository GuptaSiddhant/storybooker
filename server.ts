import {
  LocalFileDatabase,
  LocalFileStorage,
} from "./packages/adapter-fs/dist/index.js";
import { createRequestHandler } from "./packages/core/dist/index.js";

export default {
  fetch: createRequestHandler({
    auth: undefined,
    database: new LocalFileDatabase(".server/db.json"),
    staticDirs: [".server"],
    storage: new LocalFileStorage(".server"),
  }),
};
