import { RestError } from "@azure/data-tables";
import { z } from "zod";

export function parseErrorMessage(error: unknown): {
  errorMessage: string;
  errorStatus?: number;
  errorType: string;
} {
  if (typeof error === "string") {
    return { errorMessage: error, errorType: "string" };
  }

  if (error instanceof RestError) {
    return parseAzureRestError(error);
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

function parseAzureRestError(error: RestError): {
  errorMessage: string;
  errorStatus?: number;
  errorType: string;
} {
  const details = (error.details ?? {}) as Record<string, string>;
  const message: string = details["errorMessage"] ?? error.message;

  return {
    errorMessage: `${details["errorCode"] ?? error.name} (${
      error.code ?? error.statusCode
    }): ${message}`,
    errorStatus: error.statusCode,
    errorType: "AzureRest",
  };
}
