# StoryBooker adapters for AWS

Create service adapters for AWS services.

Adapter Docs: https://storybooker.js.org/docs/aws

## Hosting StoryBooker via AWS Lambda + API Gateway

> For deploying:
>
> - The AWS Lambda function should be have a HTTP API Gateway trigger.
> - The Trigger should have `/{proxy+}` route with ANY method.

Create following files in your AWS Lambda project.

### `index.js`

```js
// @ts-check

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { AwsDynamoDatabaseService } from "@storybooker/aws/dynamo-db";
import { createStoryBookerRouterHandler } from "@storybooker/aws/lambda";
import { AwsS3StorageService } from "@storybooker/aws/s3";
import { createBasicUIAdapter } from "@storybooker/ui";

export const handler = createStoryBookerRouterHandler({
  database: new AwsDynamoDatabaseService(new DynamoDBClient({})),
  storage: new AwsS3StorageService(new S3Client({})),
  ui: createBasicUIAdapter(), // remove to create headless service
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
    "@storybooker/aws": "latest",
    "@storybooker/ui": "latest"
  }
}
```
