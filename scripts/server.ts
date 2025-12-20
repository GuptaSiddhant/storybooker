// oxlint-disable sort-keys
// oxlint-disable no-console
// oxlint-disable class-methods-use-this
// oxlint-disable require-await

import { poweredBy } from "hono/powered-by";
import { timing } from "hono/timing";
import {
  createLocalFileDatabaseAdapter,
  createLocalFileStorageAdapter,
} from "../packages/core/src/adapters/_fs-adapters.ts";
import type { AuthAdapter, StoryBookerUser } from "../packages/core/src/adapters/index.ts";
import { createHonoRouter } from "../packages/core/src/index.ts";
import { createBasicUIAdapter } from "../packages/ui/src/index.tsx";

export default createHonoRouter({
  auth: createLocalAuthAdapter(),
  config: {
    middlewares: [poweredBy({ serverName: "SBR" }), timing()],
    queueLargeZipFileProcessing: true,
  },
  database: createLocalFileDatabaseAdapter(".server/db.json"),
  storage: createLocalFileStorageAdapter(".server"),
  ui: createBasicUIAdapter({
    logo: "/SBR_white_128.jpg",
    staticDirs: [".server"],
  }),
});

function createLocalAuthAdapter(): AuthAdapter {
  let auth = true;
  let user: StoryBookerUser | null = null;

  return {
    metadata: { name: "Local Auth" },

    async init() {
      user = {
        displayName: "Test User name",
        id: "user",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png",
        title: "testAdmin",
      };
    },

    authorise: () => true,

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
