# StoryBooker

Host your own StoryBooks management solution.

Docs: https://storybooker.js.org

[![pkg.pr.new](https://pkg.pr.new/badge/GuptaSiddhant/storybooker)](https://pkg.pr.new/~/GuptaSiddhant/storybooker)

## Supported hosts

### Azure Functions

Read more about hosting as [Azure Functions](./packages/azure/README.md). It provides a thin wrapper for the `core` to translate Azure Functions router to StoryBooker's router.

It is best used with Azure Database+Storage services, which are provided as [service-adapters (Read more)](./packages/azure/README.md).

### AWS

Read more about hosting as [AWS Lambda](./packages/aws/README.md). It provides a thin wrapper for the `core` to translate AWS Lambda router to StoryBooker's router.

It is best used with AWS Database+Storage services, which are provided as [service-adapters (Read more)](./packages/aws/README.md).

### GCP

Read more about hosting as [GCP Cloud Functions](./packages/gcp/README.md). The GCP uses express, so `core` can be used directly with help of `@remix-run/node-fetch-server` package.

It is best used with GCP Database+Storage services, which are provided as [service-adapters (Read more)](./packages/gcp/README.md).

### Custom

Read more about hosting as [Custom](./packages/core/README.md). You can take the `core` and host it anywhere.
