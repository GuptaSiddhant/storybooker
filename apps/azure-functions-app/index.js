// @ts-check

import { TableClient, TableServiceClient } from "@azure/data-tables";
import { app } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { AzureBlobStorageService } from "@storybooker/azure/blob-storage";
import { AzureDataTablesDatabaseService } from "@storybooker/azure/data-tables";
import { registerStoryBookerRouter } from "@storybooker/azure/functions";
import { createBasicUIAdapter } from "@storybooker/ui";

const storageConnectionString = process.env["AzureWebJobsStorage"];
if (!storageConnectionString) {
  throw new Error(
    `The storage connectionString is required to connect with Azure Storage resource.`,
  );
}

registerStoryBookerRouter(app, {
  database: new AzureDataTablesDatabaseService(
    TableServiceClient.fromConnectionString(storageConnectionString),
    (tableName) =>
      TableClient.fromConnectionString(storageConnectionString, tableName),
  ),
  storage: new AzureBlobStorageService(
    BlobServiceClient.fromConnectionString(storageConnectionString),
  ),
  ui: createBasicUIAdapter({ logo: "/SBR_white_128.jpg" }),
});
