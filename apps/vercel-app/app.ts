import "hono"; // import hono to trick vercel into recognizing hono apps

import { createHonoRouter } from "@storybooker/core";
import { LocalFileDatabase, LocalFileStorage } from "@storybooker/core/adapter/fs";
import { createBasicUIAdapter } from "@storybooker/ui";

const app = createHonoRouter({
  database: new LocalFileDatabase(),
  storage: new LocalFileStorage(),
  ui: createBasicUIAdapter({ logo: "/vercel.png" }),
});

export default app;
