# StoryBooker adapter for Azure services

Create service adapters for Azure services.

Adapter Docs: https://storybooker.js.org/docs/azure

## Hosting StoryBooker in Azure Functions

> For deploying:
>
> - Set Azure Functions runtime to `Node` and version to `22 LTS` or higher.
> - Set environment variable in deployment for `AzureWebJobsStorage` if not already done.

Create following files in your Azure Functions project.

### `index.js`

```js
// @ts-check

import { TableClient, TableServiceClient } from "@azure/data-tables";
import { app } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { AzureBlobStorageService } from "@storybooker/azure/blob-storage";
import { AzureDataTablesDatabaseService } from "@storybooker/azure/data-tables";
import { AzureEasyAuthService } from "@storybooker/azure/easy-auth";
import { registerStoryBookerRouter } from "@storybooker/azure/functions";
import { createBasicUIAdapter } from "@storybooker/ui";

const storageConnectionString = process.env["AzureWebJobsStorage"];
if (!storageConnectionString) {
  throw new Error(
    `The storage connectionString is required to connect with Azure Storage resource.`,
  );
}

registerStoryBookerRouter(app, {
  auth: new AzureEasyAuthService(), // optional auth adapter or auth-level string
  database: new AzureDataTablesDatabaseService(
    new TableServiceClient(storageConnectionString),
    (tableName) =>
      TableClient.fromConnectionString(storageConnectionString, tableName),
  ),
  storage: new AzureBlobStorageService(
    BlobServiceClient.fromConnectionString(storageConnectionString),
  ),
  ui: createBasicUIAdapter(), // remove to create headless service
});
```

### `package.json`

```json
{
  "name": "your-storybooker",
  "type": "module",
  "main": "index.js",
  "dependencies": {
    "@azure/data-tables": "^13.0.0",
    "@azure/functions": "^4.0.0",
    "@azure/storage-blob": "^12.0.0",
    "@storybooker/azure": "latest"
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
  "extensions": { "http": { "routePrefix": "" } }
}
```

### `local.settings.json` (for local dev only)

> Must not be committed to source control (git).

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true"
  }
}
```
