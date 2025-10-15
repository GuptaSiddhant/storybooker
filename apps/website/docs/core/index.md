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

### `createRequestHandler`

> [API Docs](https://jsr.io/@storybooker/core/doc/~/createRequestHandler)

Callback to create a request-handler based on provided options.

The request handler takes Standard Request and returns a Response asynchronously.

[Read more about options](./request-options)

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
