---
tags:
  - database
---

# Redis Database

The Redis database can be used as database for StoryBooker.

## Install

```sh
npm i @storybooker/redis redis
```

## Usage

```js
import { RedisDatabaseService } from "@storybooker/redis";
import { createClient } from "redis";

// Your connection string
const connectionString = process.env["REDIS_CONNECTION_STRING"];
// Initialize the Redis client
const client = createClient({ url: connectionString });
// Create the service adapter
const database = new RedisDatabaseService(client);

// use as `database` in StoryBooker hosting options.
```
