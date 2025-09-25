# StoryBooker adapters for AWS

Create service adapters for AWS services.

## Auth

> Currently no auth adapter available for AWS.

## Database

### DynamoDB

The adapter constructor accepts either a pre-configured `DynamoDBClient` instance or a configuration object for the client.

```ts
import { AwsDynamoDatabaseService } from "@storybooker/aws/dynamo-db";

const database = new AwsDynamoDatabaseService({
  region: process.env["AWS_REGION"],
  credentials: {
    accessKeyId: process.env["AWS_ACCESS_KEY_ID"],
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"],
  },
});

// use as database in StoryBooker options.
```

## Storage

The AWS S3 provides BlobStorage which can be used as storage for StoryBooker.

```ts
import { AwsS3StorageService } from "@storybooker/aws/s3";

const bucketName = process.env["AWS_S3_BUCKET_NAME"];
const storage = new AwsS3StorageService({
  region: process.env["AWS_REGION"],
  credentials: {
    accessKeyId: process.env["AWS_ACCESS_KEY_ID"]!,
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"]!,
  },
});

// use as storage in StoryBooker options.
```

## Hosting StoryBooker via AWS Lambda + API Gateway

> For deploying:
>
> - The AWS Lambda function should be have a HTTP API Gateway trigger.
> - The Trigger should have `/{proxy+}` route with ANY method.

Create following files in your AWS Lambda project.

### `index.js`

```js
// @ts-check

import { AwsDynamoDatabaseService } from "@storybooker/aws/dynamo-db";
import { createStoryBookerRouterHandler } from "@storybooker/aws/lambda";
import { AwsS3StorageService } from "@storybooker/aws/s3";

export const handler = createStoryBookerRouterHandler({
  database: new AwsDynamoDatabaseService({}),
  storage: new AwsS3StorageService({}),
});
```

### `package.json`

```json
{
  "name": "your-storybooker",
  "type": "module",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "@storybooker/aws": "latest"
  }
}
```
