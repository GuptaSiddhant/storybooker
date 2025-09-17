// oxlint-disable require-await

import {
  LocalFileDatabase,
  LocalFileStorage,
} from "./packages/adapter-fs/dist/index.js";
import {
  createRequestHandler,
  type AuthService,
  type AuthServiceAuthorise,
  type StoryBookerUser,
} from "./packages/core/dist/index.js";

class LocalAuthService implements AuthService {
  #auth = true;

  authorise: AuthServiceAuthorise = (_perm, { user }) => !!user;
  getUserDetails = async (): Promise<StoryBookerUser | null> => {
    if (!this.#auth) {
      return null;
    }
    return {
      displayName: "Test User",
      id: "user",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png",
      title: "testAdmin",
    };
  };
  login = async (request: Request, callbackUrl: string): Promise<Response> => {
    this.#auth = true;
    return new Response(null, {
      headers: { Location: callbackUrl },
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

export default {
  fetch: createRequestHandler({
    auth: new LocalAuthService(),
    database: new LocalFileDatabase(".server/db.json"),
    staticDirs: [".server"],
    storage: new LocalFileStorage(".server"),
  }),
};
