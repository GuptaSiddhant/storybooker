---
tags:
  - storage
---

# Azure BlobStorage

The Azure Storage provides BlobStorage which can be used as storage for StoryBooker.

## Install

```sh
npm i @storybooker/core @azure/storage-blob
```

## Usage

```js
import { BlobServiceClient } from "@azure/storage-blob";
import { AzureBlobStorageService } from "@storybooker/core/adapter/azure-blob-storage";

// Your connection string
const connectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"];
// Initialize the BlobServiceClient
const client = BlobServiceClient.fromConnectionString(connectionString);
// Create the Storage service adapter
const storage = new AzureBlobStorageService(client);

// use as `storage` in StoryBooker hosting options.
```
