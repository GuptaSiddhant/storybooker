// @ts-check

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { AwsDynamoDatabaseService } from "@storybooker/aws/dynamo-db";
import { createStoryBookerRouterHandler } from "@storybooker/aws/lambda";
import { AwsS3StorageService } from "@storybooker/aws/s3";

export const handler = createStoryBookerRouterHandler({
  database: new AwsDynamoDatabaseService(new DynamoDBClient({})),
  storage: new AwsS3StorageService(new S3Client({})),
});
