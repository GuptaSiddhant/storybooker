---
tags:
  - storage
---

# Google Cloud Storage

The Google Cloud Storage can be used as storage for StoryBooker.

## Install

```sh
npm i @storybooker/gcp @google-cloud/storage
```

## Usage

```js
import { Storage } from "@google-cloud/storage";
import { GoogleCloudStorageService } from "@storybooker/gcp/storage";

// Initialize the Storage client
const client = new Storage();
// Create the service adapter
const storage = new GoogleCloudStorageService(client);

// use as `storage` in StoryBooker options.
```
