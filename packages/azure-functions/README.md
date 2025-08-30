# StoryBooker for Azure Functions

Host StoryBooker on your own Azure Functions instance.

## Get started

Add following files to a Azure Functions project.

### `index.js`

```ts
import {
  AzureBlobStorageService,
  AzureDataTablesDatabaseService,
} from "@storybooker/adapter-azure";
import { registerStoryBookerRouter } from "@storybooker/azure-functions";

const storageConnectionString = process.env["AzureWebJobsStorage"];
if (!storageConnectionString) {
  throw new Error(
    `The storage connectionString is required to connect with Azure Storage resource.`,
  );
}

registerStoryBookerRouter({
  database: new AzureDataTablesDatabaseService(storageConnectionString),
  storage: new AzureBlobStorageService(storageConnectionString),
});
```

### `package.json`

```json
{
  "name": "your-storybooker",
  "type": "module",
  "main": "index.js",
  "dependencies": {
    "@azure/functions": "^4.0.0",
    "@storybooker/adapter-azure": "latest",
    "@storybooker/azure-functions": "latest"
  }
}
```

### `host.json`

```json
{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  },
  "extensions": {
    "http": {
      "routePrefix": ""
    }
  }
}
```

### `local.settings.json` (for local dev)

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true"
  }
}
```

## Deployment

- Set Azure Functions runtime to `Node` and version to `22 LTS` or higher.
- Set environment variable in deployment for `AzureWebJobsStorage` if not already done.
