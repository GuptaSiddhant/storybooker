# StoryBooker Core

The core contains the routing logic and UI for StoryBooker.
The core can be extended to be used with any platform that supports standard fetch (Request+Response).

Core Docs: https://storybooker.js.org/docs/core

### Running on basic Node server

```js
import { createServer } from "node:http";
import { createRequestListener } from "@remix-run/node-fetch-server";
import { LocalFileDatabase, LocalFileStorage } from "@storybooker/adapter";
import { createRequestHandler } from "@storybooker/core";

const handler = createRequestHandler({
  database: new LocalFileDatabase(),
  storage: new LocalFileStorage(),
});

const server = createServer(createRequestListener(handler));

server.listen(8000, () => {
  console.log("Server running at http://localhost:8000");
});
```
