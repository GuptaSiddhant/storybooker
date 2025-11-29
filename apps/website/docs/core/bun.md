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
} from "@storybooker/core";
import {
  LocalFileDatabase,
  LocalFileStorage,
} from "@storybooker/core/adapters";
import { createBasicUIAdapter } from "@storybooker/ui";

// Create StoryBooker router handler
const handler = createRequestHandler({
  // provide a supported database service adapter
  database: new LocalFileDatabase(),
  // provide a supported storage service adapter
  storage: new LocalFileStorage(),
  // provide a supported UI adapter
  ui: createBasicUIAdapter(),
});

Bun.serve({ fetch: handler });
```
