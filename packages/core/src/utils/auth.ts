import type { StoryBookerPermission, StoryBookerPermissionKey } from "../adapters/auth";
import { getStore } from "../utils/store";
import { responseError } from "./response";

export async function authenticateOrThrow(permission: StoryBookerPermission): Promise<void> {
  const { abortSignal, auth, logger, request, user } = getStore();
  if (!auth) {
    // No authentication service configured, allow all actions
    return;
  }

  if (!user) {
    throw await responseError("Unauthenticated access", 401);
  }

  const key: StoryBookerPermissionKey = `${permission.resource}:${permission.action}:${permission.projectId || ""}`;
  logger.debug?.("[Auth] Check authorisation for '%s'", key);

  try {
    const response = await auth.authorise(
      { permission: { ...permission, key }, user },
      { abortSignal, logger, request },
    );

    if (response === true) {
      // Authorized
      return;
    }

    if (response === false) {
      throw await responseError(`Permission denied [${key}]`, 403);
    }

    throw response;
  } catch (error) {
    throw await responseError(error, 403);
  }
}

export async function checkAuthorisation(permission: StoryBookerPermission): Promise<boolean> {
  try {
    await authenticateOrThrow(permission);
    return true;
  } catch {
    return false;
  }
}
