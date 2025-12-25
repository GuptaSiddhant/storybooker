---
tags:
  - database
---

# Azure CosmosDB

The Azure CosmosDB can be used as database for StoryBooker.

## Install

```sh
npm i storybooker @azure/cosmos
```

## Usage

```js
import { CosmosClient } from "@azure/cosmos";
import { AzureCosmosDatabaseService } from "storybooker/adapter/azure-cosmos-db";

// Your connection string
const connectionString = process.env["AZURE_COSMOS_CONNECTION_STRING"];
// Initialize the CosmosClient
const client = new CosmosClient(connectionString);
// Create the service adapter
const database = new AzureCosmosDatabaseService(client);

// use as `database` in StoryBooker hosting options.
```
