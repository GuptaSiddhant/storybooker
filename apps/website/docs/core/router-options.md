---
tags:
  - core
  - api
---

# Router Options

When creating a request handler using `createHonoRouter` (or a wrapper like `registerStoryBookerRouter` in Azure), you have to pass an options object which contain various service adapters and other options.

```ts
{
  /** Adapter for Auth service. Provides authentication to the service. */
  auth?: AuthService<User>;
  /** Adapter for Database service. Provides access to storing data to the service. */
  database: DatabaseService;
  /** Adapter for Logging service. Provides option to direct the logging of the service. */
  logger?: LoggerService;
  /** Adapter for Storage service. Provides access to storing files to the service. */
  storage: StorageService;
  /** Adapter for StoryBooker UI. Without this, StoryBooker will act as a headless service without a UI. */
  ui?: UIAdapter;
  /**
   * Additional custom options to be passed to the request handler.
   * - middlewares (hono compatible)
   * - file processing options
   * - error parser
   * - etc.
   */
  config?: RequestHandlerConfigOptions;
}
```

## Config Options

The `config` object can contain additional custom options to be passed to the request handler. Some of the common options include:

### Middlewares

You can pass an array of middlewares to be used by the request handler. These middlewares should be compatible with the Hono framework.

```ts
import { logger } from "hono/logger";

const config = {
  middlewares: [logger()],
};
```

Any middlewares provided by Hono can also be used here. Refer to the [Hono documentation](https://hono.dev/docs/guides/middleware) for more details.
