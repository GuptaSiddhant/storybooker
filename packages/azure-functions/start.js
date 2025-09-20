// @ts-check

import {
  AzureBlobStorageService,
  AzureDataTablesDatabaseService,
} from "@storybooker/adapter-azure";
import { registerStoryBookerRouter } from "./dist/index.js";

const storageConnectionStringEnvVar = "AzureWebJobsStorage";
const storageConnectionString = process.env[storageConnectionStringEnvVar];
if (!storageConnectionString) {
  throw new Error(
    `Missing env-var '${storageConnectionStringEnvVar}' value.
It is required to connect with Azure Storage resource.`,
  );
}

const database = new AzureDataTablesDatabaseService(storageConnectionString);
const storage = new AzureBlobStorageService(storageConnectionString);

registerStoryBookerRouter({ database, storage });
