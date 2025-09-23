// @ts-check

import { AzureBlobStorageService } from "@storybooker/adapter-azure/blob-storage";
import { AzureDataTablesDatabaseService } from "@storybooker/adapter-azure/data-tables";
import { registerStoryBookerRouter } from "./dist/index.js";

const storageConnectionStringEnvVar = "AzureWebJobsStorage";
const connectionString = process.env[storageConnectionStringEnvVar];
if (!connectionString) {
  throw new Error(
    `Missing env-var '${storageConnectionStringEnvVar}' value.
It is required to connect with Azure Storage resource.`,
  );
}

const database = new AzureDataTablesDatabaseService(connectionString);
const storage = new AzureBlobStorageService(connectionString);

registerStoryBookerRouter({ database, storage });
