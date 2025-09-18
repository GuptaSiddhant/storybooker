import { getStore } from "#store";
import type { Permission, PermissionKey } from "../types";
import { responseError } from "./response";

export async function authenticateOrThrow(
  permission: Permission,
): Promise<void> {
  const { auth, request, translation, user } = getStore();
  if (!auth) {
    return;
  }
  const key: PermissionKey = `${permission.resource}:${permission.action}:${permission.projectId || ""}`;

  try {
    const response = await auth.authorise(
      { ...permission, key },
      { request, user },
    );
    if (response === true) {
      return;
    }

    if (response === false) {
      throw responseError(
        `${translation.errorMessages.permission_denied} [${key}]`,
        403,
      );
    }

    throw response;
  } catch (error) {
    throw responseError(error, 403);
  }
}
