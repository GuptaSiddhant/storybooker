---
tags:
  - hosting
---

# Azure Functions

Host your StoryBooker instance using Azure Functions. This is a wrapper around StoryBooker core-router to make it work in Azure Functions environment using Functions HTTP Trigger.

It also registers a purge function that can be scheduled to run periodically using Azure Functions Timer Trigger. Defaults to running at midnight every day.

> Note: You can use any database/storage adapter supported by StoryBooker but it is recommended to use Azure native services for best performance.

---

## Setup

To setup a simple app with StoryBooker and Azure Functions, create a new Azure Functions project with following files:

### `package.json`

```json
{
  "name": "your-storybooker",
  "type": "module",
  "main": "index.js",
  "dependencies": {
    "@azure/functions": "^4.0.0",
    "@storybooker/core": "latest"
  }
}
```

### `index.js`

```js
// @ts-check

import { app } from "@azure/functions";
import { registerStoryBookerRouter } from "@storybooker/core/adapter/azure-functions";

registerStoryBookerRouter(app, {
  // provide your adapters here.
});
```

### `host.json`

```json
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "extensions": { "http": { "routePrefix": "" } }
}
```

## Local Development

Add a settings file for local development to provide environment variables.

### `local.settings.json`

> Must not be committed to source control (git).

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node"
  }
}
```

### Run Azure functions utility

Install Azure Functions Core Tools: https://learn.microsoft.com/en-us/core/core-functions/functions-run-local

Run the following command to start the function app locally:

```bash
func start
```

## Deployment

- Set Azure Functions runtime to `Node` and version to `22 LTS` or higher.
- Upload your function app using your preferred method (VSCode, Azure CLI, GitHub Actions, etc.)
- Make sure to set the required environment variables for your adapters in the Azure Function App settings.
