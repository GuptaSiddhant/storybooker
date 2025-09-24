// oxlint-disable require-await

import {
  LocalFileDatabase,
  LocalFileStorage,
} from "./packages/core/dist/adapters.js";
import {
  createRequestHandler,
  type StoryBookerUser,
} from "./packages/core/dist/index.js";
import type {
  AuthService,
  AuthServiceAuthorise,
} from "./packages/core/dist/types.d.ts";

class LocalAuthService implements AuthService {
  #auth = true;
  #user: StoryBookerUser | null = null;

  init = async (): Promise<void> => {
    this.#user = {
      displayName: "Test User",
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
  login = async (request: Request): Promise<Response> => {
    this.#auth = true;
    const url = new URL(request.url);
    return new Response(null, {
      headers: { Location: url.origin },
      status: 302,
    });
  };
  logout = async (request: Request): Promise<Response> => {
    this.#auth = false;
    const url = new URL(request.url);
    return new Response(null, {
      headers: { Location: url.origin },
      status: 302,
    });
  };
}

const requestHandler = createRequestHandler({
  auth: new LocalAuthService(),
  database: new LocalFileDatabase(".server/db.json"),
  staticDirs: [".server"],
  storage: new LocalFileStorage(".server"),
  ui: { logo: "https://cos-admin.azurewebsites.net/icons/cos-logo.svg" },
});

export default { fetch: requestHandler };
