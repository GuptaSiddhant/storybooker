---
tags:
  - database
---

# Google BigTable

The Google BigTable can be used as database for StoryBooker.

## Install

```sh
npm i storybooker @google-cloud/bigtable
```

## Usage

```js
import { Bigtable } from "@google-cloud/bigtable";
import { GcpBigtableDatabaseService } from "storybooker/adapter/gcp-big-table";

// Initialize the Bigtable client
const client = new Bigtable();
// Create the service adapter
const database = new GcpBigtableDatabaseService(client);

// use as `database` in StoryBooker hosting options.
```
