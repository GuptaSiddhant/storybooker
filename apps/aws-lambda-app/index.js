// @ts-check

import { AwsDynamoDatabaseService } from "@storybooker/aws/dynamo-db";
import { createStoryBookerRouterHandler } from "@storybooker/aws/lambda";
import { AwsS3StorageService } from "@storybooker/aws/s3";

export const handler = createStoryBookerRouterHandler({
  database: new AwsDynamoDatabaseService({}),
  storage: new AwsS3StorageService({}),
});
