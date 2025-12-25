---
tags:
  - database
---

# AWS DynamoDB

The AWS DynamoDB can be used as database for StoryBooker.

## Install

```sh
npm i @storybooker/core @aws-sdk/client-dynamodb
```

## Usage

```js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { AwsDynamoDatabaseService } from "@storybooker/core/adapter/aws-dynamodb";

// Initialize the DynamoDBClient
const client = new DynamoDBClient(...)
// Create the service adapter
const database = new AwsDynamoDatabaseService(client);

// use as `database` in StoryBooker hosting options.
```
