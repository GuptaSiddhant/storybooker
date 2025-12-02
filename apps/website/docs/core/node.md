---
sidebar_position: 1
tags:
  - core
---

# NodeJS

> Refer Hono docs: https://hono.dev/docs/getting-started/nodejs

Run following with `node server.mjs`

```js
// @ts-check
// server.mjs

import { serve } from "@hono/node-server";
import { createHonoRouter } from "@storybooker/core";
import {
  LocalFileDatabase,
  LocalFileStorage,
} from "@storybooker/core/adapter/fs";
import { createBasicUIAdapter } from "npm:@storybooker/ui";

// Create StoryBooker Hono router
const router = createHonoRouter({
  // provide a supported database service adapter
  database: new LocalFileDatabase(),
  // provide a supported storage service adapter
  storage: new LocalFileStorage(),
  // provide a supported UI adapter
  ui: createBasicUIAdapter(),
});

// Create a  Node.js server
serve(router);
```
