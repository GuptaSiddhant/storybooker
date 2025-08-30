# StoryBooker

Host your own StoryBooks management solution.

## Supported hosts

### Azure Functions

Read more about hosting as [Azure Functions](./packages/azure-functions/README.md). It provides a thin wrapper for the `core` to translate Azure Functions router to StoryBooker's router.

It is best used with Azure Database+Storage services, which are provided as [service-adapters (Read more)](./packages/adapter-azure/README.md).

### Custom

Read more about hosting as [Custom](./packages/core/README.md). You can take the `core` and host it anywhere.
