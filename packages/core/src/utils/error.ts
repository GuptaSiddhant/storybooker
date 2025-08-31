import { getStore } from "#store";
import { z } from "zod";

export type CustomErrorParser = (error: unknown) => ParsedError | undefined;
export interface ParsedError {
  errorMessage: string;
  errorStatus?: number;
  errorType: string;
}

export function parseErrorMessage(
  error: unknown,
  customErrorParser?: CustomErrorParser,
): ParsedError {
  if (!customErrorParser) {
    try {
      // oxlint-disable-next-line prefer-destructuring
      customErrorParser = getStore().customErrorParser;
      // oxlint-disable-next-line no-empty
    } catch {}
  }

  const customResult = customErrorParser?.(error);
  if (customResult !== undefined) {
    return customResult;
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
