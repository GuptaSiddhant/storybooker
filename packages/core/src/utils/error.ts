import { z } from "zod";
import type { ErrorParser, ParsedError } from "../types";
import { getStoreOrNull } from "../utils/store";

export function parseErrorMessage(
  error: unknown,
  errorParser?: ErrorParser,
): ParsedError {
  const customErrorParser = errorParser ?? getStoreOrNull()?.errorParser;
  const customErrorResult = customErrorParser?.(error);
  if (customErrorResult !== undefined) {
    return customErrorResult;
  }

  if (typeof error === "string") {
    return { errorMessage: error, errorType: "string" };
  }

  if (error instanceof z.core.$ZodError) {
    return {
      errorMessage: z.prettifyError(error),
      errorStatus: 400,
      errorType: "Zod",
    };
  }

  if (
    error instanceof Error ||
    (error && typeof error === "object" && "message" in error)
  ) {
    return { errorMessage: String(error.message), errorType: "error" };
  }

  return { errorMessage: String(error), errorType: "unknown" };
}
