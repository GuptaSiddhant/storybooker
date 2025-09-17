// oxlint-disable require-await
// oxlint-disable no-unsafe-assignment

import type {
  AuthService,
  AuthServiceAuthorise,
  Permission,
  StoryBookerUser,
} from "@storybooker/core";

export type { AuthServiceAuthorise } from "@storybooker/core";

export interface EasyAuthUser extends StoryBookerUser {
  roles: string[] | null;
  type: "application" | "user";
}

export type EasyAuthRoleMap = Map<string, Permission[]>;

const DEFAULT_AUTHORISE: AuthServiceAuthorise<EasyAuthUser> = (
  { action },
  { user },
) => {
  if (!user) {
    return false;
  }

  if (user.type === "application") {
    return true;
  }

  if (action === "read") {
    return true;
  }

  return Boolean(user.roles && user.roles.length > 0);
};

export class AzureEasyAuthService implements AuthService<EasyAuthUser> {
  authorise: AuthServiceAuthorise<EasyAuthUser>;

  constructor(
    authorise: AuthServiceAuthorise<EasyAuthUser> = DEFAULT_AUTHORISE,
  ) {
    this.authorise = authorise;
  }

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
      return {
        displayName: "App",
        id: azpToken,
        roles: null,
        type: "application",
      };
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
      type: "user",
    };
  }

  logout: (request: Request) => Promise<Response> = async (request) => {
    const url = new URL("/.auth/logout", request.url);

    return new Response(null, {
      headers: { Location: url.toString() },
      status: 302,
    });
  };
}
