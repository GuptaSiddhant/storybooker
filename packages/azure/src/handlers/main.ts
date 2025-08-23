import type { HttpResponseInit } from "@azure/functions";
import { authenticateOrThrow } from "#utils/auth";
import { responseError } from "#utils/response";

export async function mainHandler(): Promise<HttpResponseInit> {
  try {
    await authenticateOrThrow([]);

    return { status: 200 };
  } catch (error) {
    return responseError(error);
  }
}
