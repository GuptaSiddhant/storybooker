import { getStore } from "#store";
import type { Permission } from "#types";
import { responseError } from "./response";

export async function authenticateOrThrow(
  permissions: Permission[],
): Promise<void> {
  const { checkPermissions, context, request } = getStore();
  try {
    const response = await checkPermissions(permissions, request, context);
    if (response === true) {
      return;
    }

    const message = `Permission denied [${permissions
      .map((permission) => `'${permission.resource}:${permission.action}'`)
      .join(", ")}]`;
    context.warn(message);
    if (response === false) {
      throw responseError(message, 403);
    }
    throw response;
  } catch (error) {
    throw responseError(error, 403);
  }
}
