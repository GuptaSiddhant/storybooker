import { createHonoRouter } from "@storybooker/core";
import { LocalFileDatabase, LocalFileStorage } from "@storybooker/core/adapter/fs";

const app = createHonoRouter({
  database: new LocalFileDatabase(),
  storage: new LocalFileStorage(),
});

export default app;
