# StoryBooker adapter for Azure Storage

Create service adapters for Azure Storage.

## Database

The Azure Storage provides DataTables which can be used as database for StoryBooker.

```ts
import { AzureDataTablesDatabaseService } from "@storybooker/adapter-azure/data-tables";

const connectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"];
const database = new AzureDataTablesDatabaseService(connectionString);

// use as database in StoryBooker context.
```

## Storage

The Azure Storage provides BlobStorage which can be used as storage for StoryBooker.

```ts
import { AzureBlobStorageService } from "@storybooker/adapter-azure/blob-storage";

const connectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"];
const storage = new AzureBlobStorageService(connectionString);

// use as storage in StoryBooker context.
```
