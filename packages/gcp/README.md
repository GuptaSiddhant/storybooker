# StoryBooker adapter for GCP services

Create service adapters for GCP services.

## Auth

> Currently no auth adapter available for GCP.

## Database

GCP provides 2 options which can be used as database for StoryBooker.

### BigTable

```ts
import { GcpBigtableDatabaseService } from "@storybooker/gcp/big-table";

const database = new GcpBigtableDatabaseService({
  // Auth options can be passed here.
});

// use as database in StoryBooker options.
```

```ts
import { GcpFirestoreDatabaseService } from "@storybooker/gcp/firestore";

const database = new GcpFirestoreDatabaseService({
  // Auth options can be passed here.
});

// use as database in StoryBooker options.
```

## Storage

The Google Cloud Storage provides BlobStorage which can be used as storage for StoryBooker.

```ts
import { GoogleCloudStorageService } from "@storybooker/gcp/storage";

const storage = new GoogleCloudStorageService({
  // Auth options can be passed here.
});

// use as storage in StoryBooker options.
```

<!--
## Hosting StoryBooker in Azure Functions

> For deploying:
>
> - Set Azure Functions runtime to `Node` and version to `22 LTS` or higher.
> - Set environment variable in deployment for `AzureWebJobsStorage` if not already done.

Create following files in your Azure Functions project.

### `index.js`

```js
// @ts-check

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
``` -->
