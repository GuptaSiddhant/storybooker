// oxlint-disable no-console
// oxlint-disable class-methods-use-this
// oxlint-disable require-await

import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import type {
  AuthAdapter,
  AuthAdapterAuthorise,
  AuthAdapterOptions,
  StoryBookerUser,
} from "../packages/core/dist/adapter.d.ts";
import {
  LocalFileDatabase,
  LocalFileStorage,
} from "../packages/core/dist/adapter.js";
import { createRequestHandler } from "../packages/core/dist/index.js";
import { createBasicUIAdapter } from "../packages/ui/dist/index.js";

class LocalAuthAdapter implements AuthAdapter {
  #auth = true;
  #user: StoryBookerUser | null = null;

  init = async (): Promise<void> => {
    this.#user = {
      displayName: "Test User name",
      id: "user",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png",
      title: "testAdmin",
    };
  };

  authorise: AuthAdapterAuthorise = () => true;
  getUserDetails = async (): Promise<StoryBookerUser | null> => {
    if (!this.#auth) {
      return null;
    }
    return this.#user;
  };
  login = async ({ request }: AuthAdapterOptions): Promise<Response> => {
    this.#auth = true;
    const url = new URL(request.url);
    return new Response(null, {
      headers: { Location: url.origin },
      status: 302,
    });
  };
  logout = async (
    _user: StoryBookerUser,
    { request }: AuthAdapterOptions,
  ): Promise<Response> => {
    this.#auth = false;
    const url = new URL(request.url);
    return new Response(null, {
      headers: { Location: url.origin },
      status: 302,
    });
  };
  renderAccountDetails = (user: StoryBookerUser): string => {
    return `<p style="padding:1rem">Place anything in this iFrame about the user</p>
<pre style="padding:1rem">${JSON.stringify({ user }, null, 2)}</pre`;
  };
}

const requestHandler = createRequestHandler({
  auth: new LocalAuthAdapter(),
  config: {
    middlewares: [logger(), poweredBy({ serverName: "SBR" })],
    queueLargeZipFileProcessing: true,
  },
  database: new LocalFileDatabase(".server/db.json"),
  storage: new LocalFileStorage(".server"),
  ui: createBasicUIAdapter({
    logo: "/SBR_white_128.jpg",
    staticDirs: [".server"],
  }),
});

export default { fetch: requestHandler };
