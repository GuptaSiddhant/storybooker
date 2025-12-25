---
tags:
  - database
---

# Google Firestore

The Google Firestore can be used as database for StoryBooker.

## Install

```sh
npm i storybooker @google-cloud/firestore
```

## Usage

```js
import { Firestore } from "@google-cloud/firestore";
import { GcpFirestoreDatabaseService } from "storybooker/gcp-firestore";

// Initialize the Firestore client
const client = new Firestore();
// Create the service adapter
const database = new GcpFirestoreDatabaseService(client);

// use as `database` in StoryBooker hosting options.
```
