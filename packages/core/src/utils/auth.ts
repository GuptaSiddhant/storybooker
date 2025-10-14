import type { Permission, PermissionKey } from "../types";
import { getStore } from "../utils/store";
import { responseError } from "./response";

export async function authenticateOrThrow(
  permission: Permission,
): Promise<void> {
  const { abortSignal, auth, logger, request, translation, user } = getStore();

  if (!auth) {
    // No authentication service configured, allow all actions
    return;
  }

  if (!user) {
    throw await responseError(
      translation.errorMessages.unauthenticated_access,
      401,
    );
  }

  const key: PermissionKey = `${permission.resource}:${permission.action}:${permission.projectId || ""}`;
  logger.debug?.("[Auth] Check authorisation for '%s'.", key);

  try {
    const response = await auth.authorise(
      {
        permission: { ...permission, key },
        request,
        user,
      },
      { abortSignal },
    );

    if (response === true) {
      // Authorized
      return;
    }

    if (response === false) {
      throw await responseError(
        `${translation.errorMessages.permission_denied} [${key}]`,
        403,
      );
    }

    throw response;
  } catch (error) {
    throw await responseError(error, 403);
  }
}

export async function checkAuthorisation(
  permission: Permission,
): Promise<boolean> {
  try {
    await authenticateOrThrow(permission);
    return true;
  } catch {
    return false;
  }
}
