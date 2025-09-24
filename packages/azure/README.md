# StoryBooker adapter for Azure Storage

Create service adapters for Azure Storage.

## Auth

The Azure EasyAuth provides quick way to setup auth for Azure Functions

```ts
import {
  AzureEasyAuthService,
  type AuthServiceAuthorise,
} from "@storybooker/azure/easy-auth";

const authorize: AuthServiceAuthorise = async (permission, { user }) => {
  // check permission against user (roles)
  return true; // or false
};
const auth = new AzureEasyAuthService(authorise);

// use as auth in StoryBooker options.
```

## Database

The Azure Storage provides 2 options which can be used as database for StoryBooker.

### Data Tables

```ts
import { AzureDataTablesDatabaseService } from "@storybooker/azure/data-tables";

const connectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"];
const database = new AzureDataTablesDatabaseService(connectionString);

// use as database in StoryBooker options.
```

### Cosmos DB

```ts
import { AzureCosmosDatabaseService } from "@storybooker/azure/cosmos-db";

const connectionString = process.env["AZURE_COSMOS_DB_CONNECTION_STRING"];
const database = new AzureCosmosDatabaseService(connectionString);

// use as database in StoryBooker options.
```

## Storage

The Azure Storage provides BlobStorage which can be used as storage for StoryBooker.

```ts
import { AzureBlobStorageService } from "@storybooker/azure/blob-storage";

const connectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"];
const storage = new AzureBlobStorageService(connectionString);

// use as storage in StoryBooker options.
```

## Hosting StoryBooker in Azure Functions

> For deploying:
>
> - Set Azure Functions runtime to `Node` and version to `22 LTS` or higher.
> - Set environment variable in deployment for `AzureWebJobsStorage` if not already done.

Create following files in your Azure Functions project.

### `index.js`

```js
import { AzureBlobStorageService } from "@storybooker/azure/blob-storage";
import { AzureDataTablesDatabaseService } from "@storybooker/azure/data-tables";
import { AzureEasyAuthService } from "@storybooker/azure/easy-auth";
import { registerStoryBookerRouter } from "@storybooker/azure/functions";

const storageConnectionString = process.env["AzureWebJobsStorage"];
if (!storageConnectionString) {
  throw new Error(
    `The storage connectionString is required to connect with Azure Storage resource.`,
  );
}

registerStoryBookerRouter({
  auth: new AzureEasyAuthService(), // optional auth adapter
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
    "@azure/data-tables": "^13.0.0",
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
