---
tags:
  - core
---

# Bun

Run following with `bun run --hot server.ts`

> Refer Hono docs: https://hono.dev/docs/getting-started/bun

```ts
// server.ts

import { createHonoRouter } from "storybooker";
import {
  createLocalFileDatabaseAdapter,
  createLocalFileStorageAdapter,
} from "storybooker/adapter/fs";
import { createBasicUIAdapter } from "@storybooker/ui";

// Create StoryBooker router
const router = createHonoRouter({
  // provide a supported database service adapter
  database: createLocalFileDatabaseAdapter(),
  // provide a supported storage service adapter
  storage: createLocalFileStorageAdapter(),
  // provide a supported UI adapter
  ui: createBasicUIAdapter(),
});

export default {
  fetch: router.fetch,
  port: 8000,
};
```
