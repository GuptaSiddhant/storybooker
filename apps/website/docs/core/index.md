# StoryBooker Core

Core is the heart of StoryBooker. It provides the routing and rendering logic for StoryBooker, and is framework agnostic.

It also provides

- a set of utilities for building custom adapters and integrations.
- simple adapters for using local filesystem for storage and database (for testing and development purposes).

## Install

```sh
npm i @storybooker/core
```

## API

### `createRequestHandler`

Callback to create a request-handler based on provided options.

The request handler takes Standard Request and returns a Response asynchronously.

[Read more about options](./request-options)

### `createPurgeHandler`

Callback to create a purge-handler based on provided options.

Purging deletes all builds older than certain days based on Project's configuration.

> Note: The latest build on project's default branch is not deleted.

## Adapters (for testing)

### `LocalFileDatabase`

A simple database adapter that uses local file to store data. Defaults to `./db.json` file.

### `LocalFileStorage`

A simple storage adapter that uses local folder to store files. Defaults to current folder.

## Examples

- [NodeJS](node)
- [Deno](deno)
- [Bun](bun)
