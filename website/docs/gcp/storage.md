---
tags:
  - storage
---

# Google Cloud Storage

The Google Cloud Storage can be used as storage for StoryBooker.

## Install

```sh
npm i @storybooker/core @google-cloud/storage
```

## Usage

```js
import { Storage } from "@google-cloud/storage";
import { GoogleCloudStorageService } from "@storybooker/core/adapter/gcp-storage";

// Initialize the Storage client
const client = new Storage();
// Create the service adapter
const storage = new GoogleCloudStorageService(client);

// use as `storage` in StoryBooker options.
```
