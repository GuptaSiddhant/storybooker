---
tags:
  - ui
---

# StoryBooker UI

The UI package provides the default (basic) UI adapter for the StoryBooker router.
This package should be used for HTML based responses for all GET routes in the router.

## Install

```sh
npm i @storybooker/ui
```

## API

### `createBasicUIAdapter`

Generate Basic HTML responses for all GET routes which are completely server rendered with minimal client side interactivity.

#### Options

The function accepts options to customise the output:

- `logo`: Provide a link to your logo or a HTML string to render in the logo's place. The logo will appear in the header alongside StoryBooker's logo.
- themes: Provide custom light and/or dark theme to customise the look of the UI.
- `staticDirs`: List of directories path relative to root of the project which can be used to serve files. Defaults to `["./public"]`.

#### Usage

```ts
import { createBasicUIAdapter } from "@storybooker/ui";

const ui = createBasicUIAdapter({});

// use as `ui` in StoryBooker hosting options.
// const handler = createRequestHandler({ ui });
```
