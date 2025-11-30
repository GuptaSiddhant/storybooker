# Google Cloud Platform (GCP)

Adapters to use GCP services with StoryBooker.

## Install

```sh
npm i @storybooker/gcp
```

## Adapters

### Hosting

Refer Hono docs for deployment instructions: https://hono.dev/docs/getting-started/google-cloud-run

The hono app-router should be created using the `createHonoRouter` function from the [`@storybooker/core`](../core) package.

### Database

- [Google BigTable](big-table)
- [Google Firestore](firestore)

### Storage

- [Google Cloud Storage](storage)
