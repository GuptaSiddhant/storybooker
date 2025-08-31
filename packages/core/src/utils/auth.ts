import { getStore } from "#store";
import type { Permission } from "../types";
import { responseError } from "./response";

export async function authenticateOrThrow(
  permission: Permission,
): Promise<void> {
  const { auth, request, user } = getStore();
  if (!auth || !user) {
    return;
  }

  try {
    const response = await auth.authorise(permission, { request, user });
    if (response === true) {
      return;
    }

    if (response === false) {
      const permissionsStr = `${permission.resource}:${permission.action}:${permission.projectId || ""}`;
      throw responseError(`Permission denied [${permissionsStr}]`, 403);
    }

    throw response;
  } catch (error) {
    throw responseError(error, 403);
  }
}
