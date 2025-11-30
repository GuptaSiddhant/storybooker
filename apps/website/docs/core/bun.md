---
tags:
  - core
---

# Bun

Run following with `bun run --hot server.ts`

> Refer Hono docs: https://hono.dev/docs/getting-started/bun

```ts
// server.ts

import { createHonoRouter } from "@storybooker/core";
import {
  LocalFileDatabase,
  LocalFileStorage,
} from "@storybooker/core/adapters";
import { createBasicUIAdapter } from "@storybooker/ui";

// Create StoryBooker router
const router = createHonoRouter({
  // provide a supported database service adapter
  database: new LocalFileDatabase(),
  // provide a supported storage service adapter
  storage: new LocalFileStorage(),
  // provide a supported UI adapter
  ui: createBasicUIAdapter(),
});

export default {
  fetch: router.fetch,
  port: 8000,
};
```
