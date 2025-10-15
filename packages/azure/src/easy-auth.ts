// oxlint-disable class-methods-use-this
// oxlint-disable require-await

import type {
  AuthService,
  AuthServiceAuthorise,
  AuthServiceOptions,
  StoryBookerUser,
} from "@storybooker/core/types";

export type { AuthServiceAuthorise } from "@storybooker/core/types";

export interface AzureEasyAuthClientPrincipal {
  claims: { typ: string; val: string }[];
  auth_typ: string;
  name_typ: string;
  role_typ: string;
}

export interface AzureEasyAuthUser extends StoryBookerUser {
  roles: string[] | null;
  type: "application" | "user";
  clientPrincipal?: AzureEasyAuthClientPrincipal;
}

/**
 * Modify the final user details object created from EasyAuth Client Principal.
 */
export type ModifyUserDetails = (
  user: AzureEasyAuthUser,
  options: AuthServiceOptions,
) => AzureEasyAuthUser | Promise<AzureEasyAuthUser>;

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

const DEFAULT_MODIFY_USER: ModifyUserDetails = (user) => user;

/**
 * StoryBooker Auth adapter for Azure EasyAuth.
 */
export class AzureEasyAuthService implements AuthService<AzureEasyAuthUser> {
  authorise: AuthService<AzureEasyAuthUser>["authorise"];
  modifyUserDetails: ModifyUserDetails;

  constructor(options?: {
    /**
     * Custom function to authorise permission for user
     */
    authorise?: AuthServiceAuthorise<AzureEasyAuthUser>;
    /**
     * Modify the final user details object created from EasyAuth Client Principal.
     */
    modifyUserDetails?: ModifyUserDetails;
  }) {
    this.authorise = options?.authorise || DEFAULT_AUTHORISE;
    this.modifyUserDetails = options?.modifyUserDetails || DEFAULT_MODIFY_USER;
  }

  getUserDetails: AuthService<AzureEasyAuthUser>["getUserDetails"] = async (
    options,
  ) => {
    const principalHeader = options.request.headers.get(
      "x-ms-client-principal",
    );
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

    const clientPrincipal: AzureEasyAuthClientPrincipal =
      JSON.parse(decodedPrincipal);
    const claims = clientPrincipal?.claims || [];

    const azpToken = claims.find((claim) => claim.typ === "azp")?.val;
    if (azpToken) {
      const user: AzureEasyAuthUser = {
        clientPrincipal,
        displayName: "App",
        id: azpToken,
        roles: null,
        type: "application",
      };
      return this.modifyUserDetails(user, options);
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

    const user: AzureEasyAuthUser = {
      clientPrincipal,
      displayName: name || "",
      id: email || "",
      roles,
      title: roles.join(", "),
      type: "user",
    };
    return this.modifyUserDetails(user, options);
  };

  login: AuthService<AzureEasyAuthUser>["login"] = async ({ request }) => {
    const url = new URL("/.auth/login", request.url);

    return new Response(null, {
      headers: { Location: url.toString() },
      status: 302,
    });
  };

  logout: AuthService<AzureEasyAuthUser>["logout"] = async (
    _user,
    { request },
  ) => {
    const url = new URL("/.auth/logout", request.url);

    return new Response(null, {
      headers: { Location: url.toString() },
      status: 302,
    });
  };
}
