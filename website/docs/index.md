---
sidebar_position: 1
---

# Get started

StoryBooker is composed of 3 main parts:

- Router
- Adapters
- CLI

## Router

The router is the core of StoryBooker. It is responsible for routing requests to the page/api and using the appropriate adapter to render the response.

The entire router is maintained in the [`@storybooker/core`](./core) package. The package is used to create a Hono app-router. The router is framework agnostic and can be used in any server environment that supports NodeJS api (NodeJS, Deno, Bun, etc.).

## Adapters

Adapters are responsible for integrating with different services for hosting, storage, database and authentication. StoryBooker comes with built-in adapters for popular services, and you can also create your own custom adapters.

The adapters are maintained in their respective packages and can be mixed and matched as needed. For example, you can use the AWS hosting adapter with the Azure storage adapter.

The Adapters implement following services:

- Storage: Responsible for storing StoryBooker assets. Examples: Azure Blob Storage, AWS S3, etc.
- Database: Responsible for managing StoryBooker data. Examples: Azure CosmosDB, AWS DynamoDB, etc.
- Auth: Responsible for authenticating users. Examples: Azure EasyAuth, etc.
- Logger: Responsible for logging events and errors. Examples: Azure Application Insights, AWS CloudWatch, etc.
- UI: Responsible for providing HTML UI for GET routes. Without it, the service is headless only.

## CLI

The CLI (Command Line Interface) is a tool for interacting with StoryBooker. It provides commands for managing your StoryBooker instance, such as uploading a StoryBook build or purging builds.

The CLI is maintained in the `storybooker` package and can be installed globally or used via npx.

This is the recommended way to interact with StoryBooker in CI pipelines.
