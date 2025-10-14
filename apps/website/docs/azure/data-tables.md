---
tags:
  - database
---

# Azure DataTables

The Azure Storage provides DataTables which can be used as database for StoryBooker.

## Install

```sh
npm i @storybooker/azure @azure/data-tables
```

## Usage

```js
import { TableClient, TableServiceClient } from "@azure/data-tables";
import { AzureDataTablesDatabaseService } from "@storybooker/azure/data-tables";

// Your connection string
const connectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"];
// Create the service adapter
const database = new AzureDataTablesDatabaseService(
  TableServiceClient.fromConnectionString(connectionString),
  (tableName) => TableClient.fromConnectionString(connectionString, tableName),
);

// use as `database` in StoryBooker hosting options.
```
