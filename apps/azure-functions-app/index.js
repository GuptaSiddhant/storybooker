// @ts-check

import { TableClient, TableServiceClient } from "@azure/data-tables";
import { app } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
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

registerStoryBookerRouter(app, {
  auth: new AzureEasyAuthService(), // optional auth adapter
  database: new AzureDataTablesDatabaseService(
    new TableServiceClient(storageConnectionString),
    (tableName) =>
      TableClient.fromConnectionString(storageConnectionString, tableName),
  ),
  storage: new AzureBlobStorageService(
    BlobServiceClient.fromConnectionString(storageConnectionString),
  ),
});
