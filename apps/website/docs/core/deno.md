---
tags:
  - core
---

# Deno

Run following with `deno serve -REW server.ts`

> Note: You can change permissions based on your adapter choice.

> Refer Hono docs: https://hono.dev/docs/getting-started/deno

```ts
// server.ts

import { createHonoRouter } from "jsr:@storybooker/core";
import {
  LocalFileDatabase,
  LocalFileStorage,
} from "jsr:@storybooker/core/adapter/fs";
import { createBasicUIAdapter } from "npm:@storybooker/ui";

// Create StoryBooker router
const router = createHonoRouter({
  // provide a supported database service adapter
  database: new LocalFileDatabase(),
  // provide a supported storage service adapter
  storage: new LocalFileStorage(),
  // provide a supported UI adapter
  ui: createBasicUIAdapter(),
});

export default router;
```
