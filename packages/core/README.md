# StoryBooker Core

The core contains the routing logic and UI for StoryBooker.
The core can be extended to be used with any platform that supports standard fetch (Request+Response) or Hono server.

Docs: https://storybooker.js.org/docs/

## Running on basic Node server

> Refer Hono docs: https://hono.dev/docs/getting-started/nodejs

```js
import { serve } from "@hono/node-server";
import { createHonoRouter } from "storybooker";
import {
  createLocalFileDatabaseAdapter,
  createLocalFileStorageAdapter,
} from "storybooker/fs";
import { createBasicUIAdapter } from "@storybooker/ui";

const app = createHonoRouter({
  database: createLocalFileDatabaseAdapter(),
  storage: createLocalFileStorageAdapter(),
  ui: createBasicUIAdapter(), // remove to create headless service
});

serve(app);
```

## Running on basic Deno server

> Refer Hono docs: https://hono.dev/docs/getting-started/deno

```js
import { createHonoRouter } from "jsr:@storybooker/core";
import {
  createLocalFileDatabaseAdapter,
  createLocalFileStorageAdapter,
} from "jsr:@storybooker/core/fs";
import { createBasicUIAdapter } from "npm:@storybooker/ui";

const app = createHonoRouter({
  database: createLocalFileDatabaseAdapter(),
  storage: createLocalFileStorageAdapter(),
  ui: createBasicUIAdapter(), // remove to create headless service
});

export default router;
```
