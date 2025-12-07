import type { ErrorHandler, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import type { LoggerAdapter } from "../adapters";
import type { RouterOptions, StoryBookerUser } from "../types";
import { getStoreOrNull } from "../utils/store";
import { DEFAULT_LOCALE } from "./constants";
import { checkIsHTMLRequest } from "./request";

/**
 * A function type for parsing custom errors.
 * Return `undefined` from parser if the service should handle the error.
 */
export type ErrorParser = (error: unknown) => ParsedError | undefined;
/** Parsed error information. */
export interface ParsedError {
  errorMessage: string;
  errorStatus?: number;
  errorType: string;
}

export function parseErrorMessage(error: unknown, errorParser?: ErrorParser): ParsedError {
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

  if (error instanceof Error || (error && typeof error === "object" && "message" in error)) {
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
export function prettifyZodValidationErrorMiddleware(logger: LoggerAdapter): MiddlewareHandler {
  return async (ctx, next) => {
    await next();

    const resContentType = ctx.res.headers.get("Content-Type") || "";
    if (ctx.res.status === 400 && resContentType.startsWith("application/json")) {
      const result = zodValidationErrorSchema.safeParse(await ctx.res.clone().json());
      if (result.success) {
        const issues = JSON.parse(result.data.error.message) as z.core.$ZodIssue[];
        const message = `Validation error:\n${z.prettifyError({ issues })}`;
        logger.error(`[Zod] ${message}`);
        throw new HTTPException(400, { message, res: ctx.res });
      }
    }
  };
}

export function onUnhandledErrorHandler<User extends StoryBookerUser>(
  options: RouterOptions<User>,
): ErrorHandler {
  return (error, ctx) => {
    if (error instanceof Response) {
      return error;
    }

    const parsedError = parseErrorMessage(error);
    const { errorMessage, errorStatus, errorType } = parsedError;
    options.logger?.error(`[${errorType}:${errorStatus}] ${errorMessage}`);

    if (options?.ui?.renderErrorPage && checkIsHTMLRequest(false, ctx.req.raw)) {
      return ctx.html(
        options.ui.renderErrorPage(parsedError, {
          isAuthEnabled: !!options.auth,
          locale: DEFAULT_LOCALE,
          logger: options.logger || console,
          url: ctx.req.url,
          user: null,
        }),
        (errorStatus as ContentfulStatusCode) || 500,
      );
    }

    return new Response(errorMessage, { status: errorStatus || 500, statusText: errorType });
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
  const errorMessage = causeMessage ? `${error.message}\n ↳ ${causeMessage}` : error.message;
  return { message: errorMessage, status: errorStatus };
}
