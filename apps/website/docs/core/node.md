---
sidebar_position: 1
tags:
  - core
---

# NodeJS

Run following with `node server.mjs`

```js
// @ts-check
// server.mjs

import { createServer } from "node:http";
import { createRequestListener } from "@remix-run/node-fetch-server";
import { createRequestHandler } from "@storybooker/core";
import {
  LocalFileDatabase,
  LocalFileStorage,
} from "@storybooker/core/adapters";
import { createBasicUIAdapter } from "npm:@storybooker/ui";

// Create StoryBooker router handler
const handler = createRequestHandler({
  // provide a supported database service adapter
  database: new LocalFileDatabase(),
  // provide a supported storage service adapter
  storage: new LocalFileStorage(),
  // provide a supported UI adapter
  ui: createBasicUIAdapter(),
});

// Create a standard Node.js server
const server = createServer(createRequestListener(handler));

server.listen(8000, () => {
  console.log("Server running at http://localhost:8000");
});
```
