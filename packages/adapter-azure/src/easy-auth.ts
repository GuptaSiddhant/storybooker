// oxlint-disable require-await
// oxlint-disable no-unsafe-assignment

import type {
  AuthService,
  AuthServiceAuthorise,
  Permission,
  StoryBookerUser,
} from "@storybooker/core/types";

export type { AuthServiceAuthorise } from "@storybooker/core/types";

export interface AzureEasyAuthUser extends StoryBookerUser {
  roles: string[] | null;
  type: "application" | "user";
}

export type AzureEasyAuthRoleMap = Map<string, Permission[]>;

const DEFAULT_AUTHORISE: AuthServiceAuthorise<AzureEasyAuthUser> = ({
  permission,
  user,
}) => {
  if (!user) {
    return false;
  }

  if (user.type === "application") {
    return true;
  }

  if (permission.action === "read") {
    return true;
  }

  return Boolean(user.roles && user.roles.length > 0);
};

export class AzureEasyAuthService implements AuthService<AzureEasyAuthUser> {
  authorise: AuthService<AzureEasyAuthUser>["authorise"];

  constructor(
    authorise: AuthServiceAuthorise<AzureEasyAuthUser> = DEFAULT_AUTHORISE,
  ) {
    this.authorise = authorise;
  }

  getUserDetails: AuthService<AzureEasyAuthUser>["getUserDetails"] = async (
    request,
  ) => {
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
  };

  login: AuthService<AzureEasyAuthUser>["login"] = async (request) => {
    const url = new URL("/.auth/login", request.url);

    return new Response(null, {
      headers: { Location: url.toString() },
      status: 302,
    });
  };

  logout: AuthService<AzureEasyAuthUser>["logout"] = async (request) => {
    const url = new URL("/.auth/logout", request.url);

    return new Response(null, {
      headers: { Location: url.toString() },
      status: 302,
    });
  };
}
