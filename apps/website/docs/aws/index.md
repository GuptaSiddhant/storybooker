# AWS

Adapters to use AWS services with StoryBooker.

## Install

```sh
npm i @storybooker/aws
```

## Adapters

### Hosting

Refer Hono docs for deployment instructions: https://hono.dev/docs/getting-started/aws-lambda

The hono app-router should be created using the `createHonoRouter` function from the [`@storybooker/core`](../core) package.

### Database

- [AWS DynamoDB](dynamo-db)

### Storage

- [AWS S3](s3)
