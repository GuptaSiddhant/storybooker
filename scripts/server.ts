// oxlint-disable no-console
// oxlint-disable class-methods-use-this
// oxlint-disable require-await

import {
  LocalFileDatabase,
  LocalFileStorage,
} from "../packages/core/dist/adapters.js";
import {
  createRequestHandler,
  type StoryBookerUser,
} from "../packages/core/dist/index.js";
import type {
  AuthService,
  AuthServiceAuthorise,
  AuthServiceOptions,
} from "../packages/core/dist/types";

class LocalAuthService implements AuthService {
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

  authorise: AuthServiceAuthorise = () => true;
  getUserDetails = async (): Promise<StoryBookerUser | null> => {
    if (!this.#auth) {
      return null;
    }
    return this.#user;
  };
  login = async ({ request }: AuthServiceOptions): Promise<Response> => {
    this.#auth = true;
    const url = new URL(request.url);
    return new Response(null, {
      headers: { Location: url.origin },
      status: 302,
    });
  };
  logout = async (
    _user: StoryBookerUser,
    { request }: AuthServiceOptions,
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
  auth: new LocalAuthService(),
  database: new LocalFileDatabase(".server/db.json"),
  staticDirs: [".server"],
  storage: new LocalFileStorage(".server"),
});

export default {
  fetch: requestHandler,
};
