import { getStore } from "#store";
import type { Permission } from "../types";
import { responseError } from "./response";

export async function authenticateOrThrow(
  permissions: Permission[],
): Promise<void> {
  const { checkPermissions, request } = getStore();
  try {
    const response = await checkPermissions(permissions, request);
    if (response === true) {
      return;
    }

    const message = `Permission denied [${permissions.join(", ")}]`;
    // context.warn(message);
    if (response === false) {
      throw responseError(message, 403);
    }
    throw response;
  } catch (error) {
    throw responseError(error, 403);
  }
}
