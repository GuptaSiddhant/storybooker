import { getStore } from "#store";
import type { Permission, PermissionKey } from "../services/auth";
import { responseError } from "./response";

export async function authenticateOrThrow(
  permission: Permission,
): Promise<void> {
  const { abortSignal, auth, request, translation, user } = getStore();

  if (!auth) {
    return;
  }

  const key: PermissionKey = `${permission.resource}:${permission.action}:${permission.projectId || ""}`;

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
