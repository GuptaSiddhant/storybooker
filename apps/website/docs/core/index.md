# StoryBooker Core

Core is the heart of StoryBooker. It provides the routing and rendering logic for StoryBooker, and is framework agnostic.

> [API Docs](https://jsr.io/@storybooker/core/doc/)

It also provides

- a set of utilities for building custom adapters and integrations.
- simple adapters for using local filesystem for storage and database (for testing and development purposes).

## Install

```sh
npm i @storybooker/core
```

## API

### `createHonoRouter`

> [API Docs](https://jsr.io/@storybooker/core/doc/~/createHonoRouter)

Callback to create a Hono router that can be used as a request handler.

The Hono router can be deployed to any platform that supports Hono framework.

[Read more about options](./router-options)

### `createPurgeHandler`

> [API Docs](https://jsr.io/@storybooker/core/doc/~/createPurgeHandler)

Callback to create a purge-handler based on provided options.

Purging deletes all builds older than certain days based on Project's configuration.

> Note: The latest build on project's default branch is not deleted.

## Adapters (for testing)

### `LocalFileDatabase`

> [API Docs](https://jsr.io/@storybooker/core/doc/adapters/~/LocalFileDatabase)

A simple database adapter that uses local file to store data. Defaults to `./db.json` file.

### `LocalFileStorage`

> [API Docs](https://jsr.io/@storybooker/core/doc/adapters/~/LocalFileStorage)

A simple storage adapter that uses local folder to store files. Defaults to current folder.

## Examples

- [NodeJS](node)
- [Deno](deno)
- [Bun](bun)
- Others: Refer [Hono docs](https://hono.dev/docs/getting-started/basic)
