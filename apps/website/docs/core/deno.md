---
tags:
  - core
---

# Deno

Run following with `deno serve -REW server.ts`

> Note: You can change permissions based on your adapter choice.

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

export default { fetch: handler };
```
