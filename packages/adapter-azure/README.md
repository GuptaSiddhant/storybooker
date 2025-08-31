# StoryBooker adapter for Azure Storage

Create service adapters for Azure Storage.

## Auth

The Azure EasyAuth provides quick way to setup auth for Azure Functions

```ts
import {
  AzureEasyAuthService,
  type AuthServiceAuthorise,
} from "@storybooker/adapter-azure/easy-auth";

const authorize: AuthServiceAuthorise = async (permission, { user }) => {
  // check permission against user (roles)
  return true; // or false
};
const auth = new AzureEasyAuthService(authorise);

// use as auth in StoryBooker options.
```

## Database

The Azure Storage provides DataTables which can be used as database for StoryBooker.

```ts
import { AzureDataTablesDatabaseService } from "@storybooker/adapter-azure/data-tables";

const connectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"];
const database = new AzureDataTablesDatabaseService(connectionString);

// use as database in StoryBooker options.
```

## Storage

The Azure Storage provides BlobStorage which can be used as storage for StoryBooker.

```ts
import { AzureBlobStorageService } from "@storybooker/adapter-azure/blob-storage";

const connectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"];
const storage = new AzureBlobStorageService(connectionString);

// use as storage in StoryBooker options.
```
