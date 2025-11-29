---
tags:
  - core
  - api
---

# Request Handler Options

When creating a request handler using `createRequestHandler` (or a wrapper like `registerStoryBookerRouter` in Azure), you have to pass an options object which contain various service adapters and other options.

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
