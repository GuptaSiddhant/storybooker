# StoryBooker adapter for GCP services

Create service adapters for GCP services.

## Auth

> Currently no auth adapter available for GCP.

## Database

GCP provides 2 options which can be used as database for StoryBooker.

### BigTable

```ts
import { Bigtable } from "@google-cloud/bigtable";
import { GcpBigtableDatabaseService } from "@storybooker/gcp/big-table";

const client = new Bigtable();
const database = new GcpBigtableDatabaseService(client);

// use as database in StoryBooker options.
```

```ts
import { Firestore } from "@google-cloud/firestore";
import { GcpFirestoreDatabaseService } from "@storybooker/gcp/firestore";

const client = new Firestore();
const database = new GcpFirestoreDatabaseService(client);

// use as database in StoryBooker options.
```

## Storage

The Google Cloud Storage provides BlobStorage which can be used as storage for StoryBooker.

```ts
import { Storage } from "@google-cloud/storage";
import { GoogleCloudStorageService } from "@storybooker/gcp/storage";

const client = new Storage();
const storage = new GoogleCloudStorageService(client);

// use as storage in StoryBooker options.
```

## Hosting

Currently no hosting adapter available for GCP. Though you can use GCP's App Engine or Cloud Run to host your StoryBooker application.

To convert Express app request and response to StoryBooker compatible request and response, you can use the `@remix-run/node-fetch-server` package.
