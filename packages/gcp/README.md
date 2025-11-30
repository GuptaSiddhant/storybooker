# StoryBooker adapter for GCP services

Create service adapters for GCP services.

Adapter Docs: https://storybooker.js.org/docs/gcp

## Hosting StoryBooker via GCP Cloud Run

Follow Hono docs:

- https://hono.dev/docs/getting-started/google-cloud-run

Follow the docs but replace `const app = new Hono()` with

```ts
import { createHonoRouter } from "@storybooker/core";

const app = createHonoRouter({
  // ...adapters
});
```
