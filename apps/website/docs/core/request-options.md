---
tags:
  - options
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
  /**
   * A function for parsing custom errors.
   * Return `undefined` from parser if the service should handle the error.
   */
  errorParser?: ErrorParser;
  /** Adapter for Logging service. Provides option to direct the logging of the service. */
  logger?: LoggerService;
  /**
   * List of middlewares that run before a request is handled.
   * Run middleware to modify incoming Request or outgoing Response.
   */
  middlewares?: Middleware[];
  /** Options to update OpenAPI spec of the service */
  openAPI?: OpenAPIOptions;
  /** Convey URL prefix to the service if the router is not hosted on the root. */
  prefix?: string;
  /**
   * List of path of directories relative to root where static media is kept.
   * @default ["./public"]
   */
  staticDirs?: readonly string[];
  /** Adapter for Storage service. Provides access to storing files to the service. */
  storage: StorageService;
  /** Options to customise StoryBooker UI. */
  ui?: UIOptions;
}
```
