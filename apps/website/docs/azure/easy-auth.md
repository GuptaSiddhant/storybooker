---
tags:
  - auth
---

# Azure EasyAuth

The Azure EasyAuth provides quick way to setup auth for Azure Functions

## Install

```sh
npm i @storybooker/azure
```

## Usage

```ts
import {
  AzureEasyAuthService,
  type AuthServiceAuthorise,
} from "@storybooker/azure/easy-auth";

// Optionally create a custom authorise function
// to handle permission checks
const authorise: AuthServiceAuthorise = async (permission, { user }) => {
  // check permission against user (roles)
  return true; // or false
};
// Create the service adapter
const auth = new AzureEasyAuthService(authorise);

// use as `auth` in StoryBooker options.
```
