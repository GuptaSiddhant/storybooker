import { getStore } from "#store";
import type { Permission } from "../types";
import { responseError } from "./response";

export async function authenticateOrThrow(
  permissions: Permission[],
): Promise<void> {
  const { checkPermissions, request, logger } = getStore();
  try {
    const response = await checkPermissions(permissions, { logger, request });
    if (response === true) {
      return;
    }

    if (response === false) {
      const permissionsStr = permissions
        .map(
          (permission) =>
            `${permission.resource}:${permission.action}:${permission.projectId || ""}`,
        )
        .join(", ");
      const message = `Permission denied [${permissionsStr}]`;
      throw responseError(message, 403);
    }

    throw response;
  } catch (error) {
    throw responseError(error, 403);
  }
}
