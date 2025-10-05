# Google Cloud Platform (GCP)

Adapters to use GCP services with StoryBooker.

## Install

```sh
npm i @storybooker/gcp
```

## Adapters

### Hosting

Currently no hosting adapter available for GCP. Though you can use GCP's App Engine or Cloud Run to host your StoryBooker application.

To convert Express app request and response to StoryBooker compatible request and response, you can use the [`@remix-run/node-fetch-server`](https://npm.im/@remix-run/node-fetch-server) package with [`@storybooker/core`](../core).

### Database

- [Google BigTable](big-table)
- [Google Firestore](firestore)

### Storage

- [Google Cloud Storage](storage)
