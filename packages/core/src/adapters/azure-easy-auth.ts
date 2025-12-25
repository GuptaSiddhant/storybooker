// oxlint-disable class-methods-use-this

import { Buffer } from "node:buffer";
import {
  StoryBookerPermissionsList,
  StoryBookerPermissionsAllEnabled,
  type AuthAdapter,
  type AuthAdapterOptions,
  type StoryBookerPermissionAction,
  type StoryBookerPermissionResource,
  type StoryBookerPermissionWithKey,
  type StoryBookerUser,
} from "./_internal/auth.ts";

export type {
  StoryBookerPermission,
  StoryBookerPermissionAction,
  StoryBookerPermissionKey,
  StoryBookerPermissionResource,
  StoryBookerPermissionWithKey,
} from "./_internal/auth.ts";

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

export type AuthAdapterAuthorise<AuthUser extends StoryBookerUser = StoryBookerUser> = (
  permission: StoryBookerPermissionWithKey,
  user: Omit<AuthUser, "permissions">,
) => boolean;

/**
 * Modify the final user details object created from EasyAuth Client Principal.
 */
export type ModifyUserDetails = <User extends Omit<AzureEasyAuthUser, "permissions">>(
  user: User,
  options: AuthAdapterOptions,
) => User | Promise<User>;

const DEFAULT_AUTHORISE: AuthAdapterAuthorise<AzureEasyAuthUser> = (permission, user) => {
  if (!user) {
    return false;
  }

  if (permission.action === "read") {
    return true;
  }

  return Boolean(user.roles && user.roles.length > 0);
};

const DEFAULT_MODIFY_USER: ModifyUserDetails = (user) => user;

/**
 * StoryBooker Auth adapter for Azure EasyAuth.
 *
 * @example
 * ```ts
 * const auth = new AzureEasyAuthService();
 * ```
 */
export class AzureEasyAuthService implements AuthAdapter<AzureEasyAuthUser> {
  #authorise: AuthAdapterAuthorise<AzureEasyAuthUser>;
  #modifyUserDetails: ModifyUserDetails;

  metadata: AuthAdapter["metadata"] = { name: "Azure Easy Auth" };

  constructor(options?: {
    /**
     * Custom function to authorise permission for user
     */
    authorise?: AuthAdapterAuthorise<AzureEasyAuthUser>;
    /**
     * Modify the final user details object created from EasyAuth Client Principal.
     */
    modifyUserDetails?: ModifyUserDetails;
  }) {
    this.#authorise = options?.authorise ?? DEFAULT_AUTHORISE;
    this.#modifyUserDetails = options?.modifyUserDetails ?? DEFAULT_MODIFY_USER;
  }

  getUserDetails: AuthAdapter<AzureEasyAuthUser>["getUserDetails"] = async (options) => {
    const principalHeader = options.request.headers.get("x-ms-client-principal");
    if (!principalHeader) {
      throw new Response(`Unauthorized access. Please provide a valid EasyAuth principal header.`, {
        status: 401,
      });
    }

    // Decode and parse the claims
    const decodedPrincipal = Buffer.from(principalHeader, "base64").toString("utf8");

    const clientPrincipal = JSON.parse(decodedPrincipal) as AzureEasyAuthClientPrincipal;
    const claims = clientPrincipal?.claims ?? [];

    const azpToken = claims.find((claim) => claim.typ === "azp")?.val;
    if (azpToken) {
      const user: AzureEasyAuthUser = {
        clientPrincipal,
        displayName: "App",
        id: azpToken,
        permissions: StoryBookerPermissionsAllEnabled,
        roles: null,
        type: "application",
      };
      return user;
    }

    const name = claims.find((claim) => claim.typ === "name")?.val;
    const email = claims.find((claim) => claim.typ === clientPrincipal.name_typ)?.val;
    const roles = claims
      .filter((claim) => claim.typ === clientPrincipal.role_typ || claim.typ === "roles")
      .map((claim) => claim.val);

    const userWithoutPermissions: Omit<AzureEasyAuthUser, "permissions"> = {
      clientPrincipal,
      displayName: name ?? "",
      id: email ?? "",
      roles,
      title: roles.join(", "),
      type: "user",
    };

    return {
      ...(await this.#modifyUserDetails(userWithoutPermissions, options)),
      permissions: authoriseUserPermissions(this.#authorise, userWithoutPermissions),
    };
  };

  login: AuthAdapter<AzureEasyAuthUser>["login"] = ({ request }) => {
    const url = new URL("/.auth/login", request.url);

    return new Response(null, {
      headers: { Location: url.toString() },
      status: 302,
    });
  };

  logout: AuthAdapter<AzureEasyAuthUser>["logout"] = (_user, { request }) => {
    const url = new URL("/.auth/logout", request.url);

    return new Response(null, {
      headers: { Location: url.toString() },
      status: 302,
    });
  };
}

function authoriseUserPermissions(
  authorise: AuthAdapterAuthorise<AzureEasyAuthUser>,
  user: Omit<AzureEasyAuthUser, "permissions">,
): AzureEasyAuthUser["permissions"] {
  const permissions: AzureEasyAuthUser["permissions"] = {};

  for (const key of StoryBookerPermissionsList) {
    const [resource, action] = key.split(":") as [
      StoryBookerPermissionResource,
      StoryBookerPermissionAction,
    ];
    const permission: StoryBookerPermissionWithKey = { action, key, resource };
    permissions[key] = authorise(permission, user);
  }

  return permissions;
}
