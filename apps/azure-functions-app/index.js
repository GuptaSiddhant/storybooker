import { AzureBlobStorageService } from "@storybooker/azure/blob-storage";
import { AzureDataTablesDatabaseService } from "@storybooker/azure/data-tables";
import { registerStoryBookerRouter } from "@storybooker/azure/functions";

const storageConnectionString = process.env["AzureWebJobsStorage"];
if (!storageConnectionString) {
  throw new Error(
    `The storage connectionString is required to connect with Azure Storage resource.`,
  );
}

registerStoryBookerRouter({
  database: new AzureDataTablesDatabaseService(storageConnectionString),
  storage: new AzureBlobStorageService(storageConnectionString),
});
