# StoryBooker Core

The core contains the routing logic and UI for StoryBooker.
The core can be extended to be used with any platform that supports standard fetch (Request+Response).

## Examples

### Node

```js
import * as http from 'node:http';
import { createRequestListener } from "@remix-run/node-fetch-server"
import { createRequestHandler, type RequestHandlerOptions } from "@storybooker/core";

const options: RequestHandlerOptions = {
    database: , // provide a supported database service adapter
    storage: , // provide a supported storage service adapter
}

// Create StoryBooker router handler
const handler = createRequestHandler(options)

// Create a standard Node.js server
const server = http.createServer(createRequestListener(handler));

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
```

### Deno

Run following with `deno serve -A server.ts`

```ts
// server.ts
import { createRequestHandler, type RequestHandlerOptions } from "npm:@storybooker/core";

const options: RequestHandlerOptions = {
    database: , // provide a supported database service adapter
    storage: , // provide a supported storage service adapter
}

export default { fetch: createRequestHandler(options) };
```

## Exports

### `createRequestHandler`

Callback to create a request-handler based on provided options.

The request handler takes Standard Request and returns a Response asynchronously.

### `createPurgeHandler`

Callback to create a purge-handler based on provided options.

Purging deletes all builds older than certain days based on Project's configuration.

Note: The latest build on project's default branch is not deleted.
