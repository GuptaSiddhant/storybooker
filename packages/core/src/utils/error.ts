import type { ErrorHandler, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { LoggerAdapter } from "../adapters";
import type { ErrorParser, ParsedError } from "../types";
import { getStoreOrNull } from "../utils/store";

export function parseErrorMessage(
  error: unknown,
  errorParser?: ErrorParser,
): ParsedError {
  if (!error) {
    return { errorMessage: "", errorType: "unknown" };
  }

  const customErrorParser = errorParser ?? getStoreOrNull()?.errorParser;
  const customErrorResult = customErrorParser?.(error);
  if (customErrorResult !== undefined) {
    return customErrorResult;
  }

  if (typeof error === "string") {
    return { errorMessage: error, errorType: "string" };
  }

  if (error instanceof HTTPException) {
    const { message, status } = unwrapHttpException(error);
    return {
      errorMessage: message,
      errorStatus: status,
      errorType: "HTTPException",
    };
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

const zodValidationErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    name: z.literal("ZodError"),
    message: z.string(),
  }),
});
export const prettifyZodValidationErrorMiddleware: MiddlewareHandler = async (
  ctx,
  next,
) => {
  await next();

  const resContentType = ctx.res.headers.get("Content-Type") || "";
  if (ctx.res.status === 400 && resContentType.startsWith("application/json")) {
    const result = zodValidationErrorSchema.safeParse(
      await ctx.res.clone().json(),
    );
    if (result.success) {
      const issues = JSON.parse(
        result.data.error.message,
      ) as z.core.$ZodIssue[];
      const message = `Validation error:\n${z.prettifyError({ issues })}`;
      throw new HTTPException(400, { message, res: ctx.res });
    }
  }
};

export function onUnhandledErrorHandler(logger: LoggerAdapter): ErrorHandler {
  return (error) => {
    const { errorMessage, errorType, errorStatus } = parseErrorMessage(error);
    logger.error(`[${errorType}:${errorStatus}] ${errorMessage}`);

    return new Response(errorMessage, { status: errorStatus || 500 });
  };
}

function unwrapHttpException(error: HTTPException): {
  message: string;
  status?: number;
} {
  let causeMessage = "";
  let causeStatus: number | undefined = error.status;

  if (error.cause) {
    if (error.cause instanceof HTTPException) {
      const { message, status } = unwrapHttpException(error.cause);
      causeMessage = message;
      causeStatus = status;
    } else {
      const { errorMessage } = parseErrorMessage(error.cause);
      causeMessage = errorMessage;
    }
  }

  const errorStatus = causeStatus ?? error.status;
  const errorMessage = causeMessage
    ? `${error.message}\n ↳ ${causeMessage}`
    : error.message;
  return { message: errorMessage, status: errorStatus };
}
