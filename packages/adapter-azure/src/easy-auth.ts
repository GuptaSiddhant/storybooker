// oxlint-disable require-await

import type {
  AuthService,
  AuthServiceAuthorise,
  Permission,
  StoryBookerUser,
} from "@storybooker/core";

export type { AuthServiceAuthorise } from "@storybooker/core";

export interface EasyAuthUser extends StoryBookerUser {
  roles: string[] | null;
}

export type EasyAuthRoleMap = Map<string, Permission[]>;

export class AzureEasyAuthService implements AuthService<EasyAuthUser> {
  #authorise: AuthServiceAuthorise<EasyAuthUser>;

  constructor(authorise: AuthServiceAuthorise<EasyAuthUser>) {
    this.#authorise = authorise;
  }

  authorise: AuthServiceAuthorise<EasyAuthUser> = async (permission, options) =>
    this.#authorise(permission, options);

  async getUserDetails(request: Request): Promise<EasyAuthUser> {
    const principalHeader = request.headers.get("x-ms-client-principal");
    if (!principalHeader) {
      throw new Response(
        `Unauthorized access. Please provide a valid EasyAuth principal header.`,
        { status: 401 },
      );
    }

    // Decode and parse the claims
    const decodedPrincipal = Buffer.from(principalHeader, "base64").toString(
      "utf8",
    );
    const clientPrincipal: {
      claims: { typ: string; val: string }[];
      auth_typ: string;
      name_typ: string;
      role_typ: string;
    } = JSON.parse(decodedPrincipal);
    const claims = clientPrincipal?.claims || [];

    const azpToken = claims.find((claim) => claim.typ === "azp")?.val;
    if (azpToken) {
      return { displayName: "Application", id: azpToken, roles: null };
    }

    const name = claims.find((claim) => claim.typ === "name")?.val;
    const email = claims.find(
      (claim) => claim.typ === clientPrincipal.name_typ,
    )?.val;
    const roles = claims
      .filter(
        (claim) =>
          claim.typ === clientPrincipal.role_typ || claim.typ === "roles",
      )
      .map((claim) => claim.val);

    return {
      displayName: name || "",
      id: email || "",
      roles,
      title: roles.join(", "),
    };
  }

  logout: (request: Request) => Promise<Response> = async (request) => {
    const url = new URL("/.auth/logout", request.url);
    // url.searchParams.set("post_logout_redirect_uri", "");
    return new Response(null, {
      headers: { Location: url.toString() },
      status: 302,
    });
  };
}
