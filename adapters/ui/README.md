# StoryBooker UI

The package contains the logic for rendering UI for StoryBooker routes.
The adapter provides functions to render HTML for all the routes supported by the Core.

UI Docs: https://storybooker.js.org/docs/ui

## Example

```js
import { createBasicUIAdapter } from "@storybooker/ui";

const handler = createRequestHandler({
  ...
  ui: createBasicUIAdapter(), // Add UI adapter for providing HTML responses for routes.
});
```
