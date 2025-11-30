# StoryBooker adapters for AWS

Create service adapters for AWS services.

Adapter Docs: https://storybooker.js.org/docs/aws

## Hosting StoryBooker via AWS Lambda + API Gateway

Follow Hono docs:

- https://hono.dev/docs/getting-started/aws-lambda
- https://hono.dev/docs/getting-started/lambda-edge

Follow the docs but replace `const app = new Hono()` with

```ts
import { createHonoRouter } from "@storybooker/core";

const app = createHonoRouter({
  // ...adapters
});
```
