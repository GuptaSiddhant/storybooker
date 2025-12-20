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
const authorise: AuthServiceAuthorise = async (permission, user) => {
  // check permission against user (roles)
  return true; // or false
};

// Create the service adapter
const auth = new AzureEasyAuthService({ authorise });

// use as `auth` in StoryBooker options.
```

## Headless/CLI

Once Azure EasyAuth is used as the authentication layer, users are redirected to login page before accessing the page/UI.

But for other applications like CLI, where login-by-redirect is not possible, a Auth-Token is required to make requests to the StoryBooker service.

### Azure EntraID

To generate auth token for the service when EasyAuth is configured with EntraID.

> Note: You can cache the auth-token as the token expired in some time (`data.expires_in`). The expire duration is provided in seconds.

```js
/**
 * Generate AuthToken for EntraId application.
 * @param {string} tenantId Your Azure TenantID where EntraId application is registered.
 * @param {string} clientId The ClientId for the EntraID application.
 * @param {string} clientSecret The ClientSecret for the EntraID application.
 * @return {string} The authorization header value that can be passed to StoryBooker request.
 */
async function getEntraIdAppAuthToken(tenantId, clientId, clientSecret) {
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const headers = new Headers();
  headers.set("Content-Type", "application/x-www-form-urlencoded");
  const body = new URLSearchParams();
  body.append("client_id", clientId);
  body.append("scope", `api://${clientId}/.default`);
  body.append("client_secret", clientSecret);
  body.append("grant_type", "client_credentials");

  const response = await fetch(url, { body, headers, method: "POST" });
  /** @type {{ token_type: 'Bearer', expires_in: number, access_token: string }} */
  const data = await response.json();
  const authorizationHeaderValue = `${data["token_type"]} ${data["access_token"]}`;

  return authorizationHeaderValue;
}
```

Once the auth-token is generated, it can be used for authenticating with StoryBooker service

```js
const authorizationHeaderValue = await getEntraIdAppAuthToken(
  "<tenantId>",
  "<clientId>",
  "<clientSecret>",
);

const response = await fetch(`https://<your-storybooker-domain>/health`, {
  headers: { authorization: authorizationHeaderValue },
});

console.log(response.status); // should be 200
```
