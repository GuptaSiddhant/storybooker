import { HTTPException } from "hono/http-exception";
import type { StoryBookerPermission, StoryBookerPermissionKey } from "../adapters/auth.ts";
import { getStore } from "../utils/store.ts";

export async function authenticateOrThrow(permission: StoryBookerPermission): Promise<void> {
  const { abortSignal, auth, logger, request, user } = getStore();
  if (!auth) {
    // No authentication service configured, allow all actions
    return;
  }

  if (!user) {
    throw new HTTPException(401, { message: "Unauthenticated. Please log in to continue." });
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
      throw new HTTPException(403, { message: `Permission denied [${key}]` });
    }

    throw response;
  } catch (error) {
    throw new HTTPException(403, { cause: error });
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
