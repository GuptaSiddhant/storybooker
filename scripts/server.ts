// oxlint-disable sort-keys
// oxlint-disable no-console
// oxlint-disable class-methods-use-this
// oxlint-disable require-await

import { poweredBy } from "hono/powered-by";
import { timing } from "hono/timing";
import {
  type AuthAdapter,
  type StoryBookerUser,
  StoryBookerPermissionsAllEnabled,
} from "../packages/core/dist/_internal/adapter/auth.mjs";
import {
  createLocalFileDatabaseAdapter,
  createLocalFileStorageAdapter,
} from "../packages/core/dist/fs.mjs";
import { createHonoRouter } from "../packages/core/dist/index.mjs";
import { createBasicUIAdapter } from "../packages/ui/dist/index.mjs";

const router = createHonoRouter({
  auth: createLocalAuthAdapter(),
  config: {
    middlewares: [poweredBy({ serverName: "SBR" }), timing()],
    queueLargeZipFileProcessing: true,
    webhooks: [
      {
        url: "https://webhook.site/d80c03c7-8cd4-49b9-bc13-778736819f3a",
        headers: { "x-custom-header": "custom-value" },
      },
    ],
  },
  database: createLocalFileDatabaseAdapter(".server/db.json"),
  storage: createLocalFileStorageAdapter(".server"),
  ui: createBasicUIAdapter({ logo: "/SBR_white_128.jpg", staticDirs: [".server"] }),
});

export default router;

// serve({ fetch: router.fetch, port: 8000 }, (info) => {
//   console.log(`🚀 StoryBooker server running at http://${info.address}:${info.port}`);
// });

function createLocalAuthAdapter(): AuthAdapter {
  let auth = true;
  let user: StoryBookerUser | null = null;

  return {
    metadata: {
      name: "Local Auth",
      description: "Local authentication for development purposes.",
    },

    async init() {
      user = {
        displayName: "Test User name",
        id: "user",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png",
        title: "testAdmin",
        permissions: StoryBookerPermissionsAllEnabled,
      };
    },

    async getUserDetails() {
      return auth ? user : null;
    },

    async login({ request }) {
      auth = true;
      const url = new URL(request.url);
      return new Response(null, {
        headers: { Location: url.origin },
        status: 302,
      });
    },

    async logout(_user, { request }) {
      auth = false;
      const url = new URL(request.url);
      return new Response(null, {
        headers: { Location: url.origin },
        status: 302,
      });
    },

    renderAccountDetails(user) {
      return `<p style="padding:1rem">Place anything in this iFrame about the user</p>
<pre style="padding:1rem">${JSON.stringify({ user }, null, 2)}</pre>`;
    },
  };
}
