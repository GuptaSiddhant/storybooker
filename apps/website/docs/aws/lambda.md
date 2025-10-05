---
tags:
  - hosting
---

# AWS Lambda + API Gateway

Host your StoryBooker instance using AWS Lambda. This is a wrapper around StoryBooker core-router to make it work in AWS Lambda environment using API Gateway.

> Note: You can use any database/storage adapter supported by StoryBooker but it is recommended to use AWS native services for best performance.

## Install

```sh
npm i @storybooker/aws
```

## Setup

### `package.json`

```json
{
  "name": "your-storybooker",
  "type": "module",
  "main": "index.js",
  "dependencies": {
    "@storybooker/aws": "latest"
  }
}
```

### `index.js`

```js
// @ts-check

import { createStoryBookerRouterHandler } from "@storybooker/aws/lambda";

export const handler = createStoryBookerRouterHandler({
  // provide your adapters here.
});
```

## Deploy

- The AWS Lambda function should be have a HTTP API Gateway trigger.
- The Trigger should have `/{proxy+}` route with `ANY` method.
