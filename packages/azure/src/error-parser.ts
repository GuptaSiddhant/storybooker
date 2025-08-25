import type { RestError } from "@azure/core-rest-pipeline";
import type { ParsedError } from "@storybooker/router/error-utils";

export function parseAzureRestError(error: unknown): ParsedError | undefined {
  if (error instanceof Error && error.name === "RestError") {
    const restError = error as RestError;
    const details = (restError.details ?? {}) as Record<string, string>;
    const message: string = details["errorMessage"] ?? restError.message;

    return {
      errorMessage: `${details["errorCode"] ?? restError.name} (${
        restError.code ?? restError.statusCode
      }): ${message}`,
      errorStatus: restError.statusCode,
      errorType: "AzureRest",
    };
  }

  return undefined;
}
