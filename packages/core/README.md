# StoryBooker Core

The core contains the routing logic and UI for StoryBooker.
The core can be extended to be used with any platform that supports standard fetch (Request+Response).

## Examples

### Node

```js
import * as http from 'node:http';
import { createRequestListener } from "@remix-run/node-fetch-server"
import { createRequestHandler, type RouterContext } from "@storybooker/core";

const context: RouterContext = {
    database: , // provide a supported database service adapter
    storage: , // provide a supported storage service adapter
}

// Create StoryBooker router handler
const handler = createRequestHandler(context)

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
import { createRequestHandler, type RouterContext } from "npm:@storybooker/core";

const context: RouterContext = {
    database: , // provide a supported database service adapter
    storage: , // provide a supported storage service adapter
}

export default { fetch: createRequestHandler(context) };
```
