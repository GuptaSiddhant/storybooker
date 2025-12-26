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

/**
 * Azure Easy Auth client principal structure.
 *
 * @description
 * Represents the decoded user principal object from Azure Easy Auth.
 * This is extracted from the `x-ms-client-principal` header.
 */
export interface AzureEasyAuthClientPrincipal {
  claims: { typ: string; val: string }[];
  auth_typ: string;
  name_typ: string;
  role_typ: string;
}

/**
 * Extended user object for Azure Easy Auth.
 *
 * @description
 * Extends StoryBookerUser with Azure Easy Auth-specific properties
 * including roles, user type, and the original client principal.
 */
export interface AzureEasyAuthUser extends StoryBookerUser {
  roles: string[] | null;
  type: "application" | "user";
  clientPrincipal?: AzureEasyAuthClientPrincipal;
}

/**
 * Custom authorization function for Azure Easy Auth.
 *
 * @description
 * Function to determine if a user has permission to perform a specific action.
 * Called for each permission during user authentication.
 *
 * @param permission - The permission being checked
 * @param user - The user object (without permissions)
 * @returns `true` if the user is authorized, `false` otherwise
 */
export type AzureEasyAuthAdapterAuthorise<AuthUser extends StoryBookerUser = StoryBookerUser> = (
  permission: StoryBookerPermissionWithKey,
  user: Omit<AuthUser, "permissions">,
) => boolean;

/**
 * Function to modify user details after authentication.
 *
 * @description
 * Allows customization of the user object created from Azure Easy Auth.
 * Can be used to add additional properties or transform existing ones.
 *
 * @param user - The user object created from the client principal
 * @param options - Common options like abortSignal
 * @returns The modified user object
 */
export type AzureEasyAuthModifyUserDetails = <User extends Omit<AzureEasyAuthUser, "permissions">>(
  user: User,
  options: AuthAdapterOptions,
) => User | Promise<User>;

const DEFAULT_AUTHORISE: AzureEasyAuthAdapterAuthorise<AzureEasyAuthUser> = (permission, user) => {
  if (!user) {
    return false;
  }

  if (permission.action === "read") {
    return true;
  }

  return Boolean(user.roles && user.roles.length > 0);
};

const DEFAULT_MODIFY_USER: AzureEasyAuthModifyUserDetails = (user) => user;

/**
 * Azure Easy Auth implementation of the AuthAdapter interface.
 *
 * @classdesc
 * Provides authentication for StoryBooker using Azure Easy Auth (App Service Authentication).
 * Handles user authentication through Azure AD, social providers, or custom authentication
 * configured in Azure App Service.
 *
 * @example
 * ```ts
 * import { AzureEasyAuthService } from "storybooker/azure-easy-auth";
 *
 * // Basic usage with default settings
 * const auth = new AzureEasyAuthService();
 *
 * // With custom authorization logic
 * const auth = new AzureEasyAuthService({
 *   authorise: (permission, user) => {
 *     // Custom permission logic
 *     if (permission.action === "write") {
 *       return user.roles?.includes("admin") ?? false;
 *     }
 *     return true;
 *   },
 * });
 *
 * // Use with StoryBooker
 * const router = createHonoRouter({ auth });
 * ```
 *
 * @see {@link https://learn.microsoft.com/azure/app-service/overview-authentication-authorization | Azure Easy Auth Documentation}
 */
export class AzureEasyAuthService implements AuthAdapter<AzureEasyAuthUser> {
  #authorise: AzureEasyAuthAdapterAuthorise<AzureEasyAuthUser>;
  #modifyUserDetails: AzureEasyAuthModifyUserDetails;

  metadata: AuthAdapter["metadata"] = { name: "Azure Easy Auth" };

  /**
   * Creates a new Azure Easy Auth adapter instance.
   *
   * @param options - Configuration options for the adapter
   * @param options.authorise - Custom function to authorize permissions for users (defaults to allowing reads for all, writes for users with roles)
   * @param options.modifyUserDetails - Function to modify user details after authentication (defaults to no modification)
   *
   * @example
   * ```ts
   * const auth = new AzureEasyAuthService({
   *   authorise: (permission, user) => {
   *     return user.roles?.includes("editor") ?? false;
   *   },
   *   modifyUserDetails: async (user, options) => {
   *     // Fetch additional user data
   *     return { ...user, customField: "value" };
   *   },
   * });
   * ```
   */
  constructor(options?: {
    /**
     * Custom function to authorise permission for user
     */
    authorise?: AzureEasyAuthAdapterAuthorise<AzureEasyAuthUser>;
    /**
     * Modify the final user details object created from EasyAuth Client Principal.
     */
    modifyUserDetails?: AzureEasyAuthModifyUserDetails;
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
  authorise: AzureEasyAuthAdapterAuthorise<AzureEasyAuthUser>,
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
