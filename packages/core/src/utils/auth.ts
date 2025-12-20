import { HTTPException } from "hono/http-exception";
import type { StoryBookerPermission, StoryBookerPermissionKey } from "../adapters/auth.ts";
import { getStore } from "../utils/store.ts";

export function authenticateOrThrow(permission: StoryBookerPermission): void {
  const { auth, logger, user } = getStore();
  if (!auth) {
    // No authentication service configured, allow all actions
    return;
  }

  if (!user) {
    throw new HTTPException(401, { message: "Unauthenticated. Please log in to continue." });
  }

  const key: StoryBookerPermissionKey = `${permission.resource}:${permission.action}`;
  logger.debug?.("[Auth] Check authorisation for '%s'", key);

  // Authorized
  const hasPermission = user.permissions[key];

  if (hasPermission) {
    return;
  }

  throw new HTTPException(403, { message: `Permission denied [${key}]` });
}

export function checkAuthorisation(permission: StoryBookerPermission): boolean {
  try {
    authenticateOrThrow(permission);
    return true;
  } catch {
    return false;
  }
}
