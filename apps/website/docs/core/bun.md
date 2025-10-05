---
tags:
  - core
---

# Bun

Run following with `bun server.ts`

```ts
// server.ts

import {
  createRequestHandler,
  type RequestHandlerOptions,
} from "npm:@storybooker/core";
import {
  LocalFileDatabase,
  LocalFileStorage,
} from "npm:@storybooker/core/adapters";

// Create StoryBooker router handler
const handler = createRequestHandler({
  // provide a supported database service adapter
  database: new LocalFileDatabase(),
  // provide a supported storage service adapter
  storage: new LocalFileStorage(),
});

Bun.serve({ fetch: handler });
```
