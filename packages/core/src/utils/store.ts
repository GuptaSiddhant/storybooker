import { SuperHeaders } from "@remix-run/headers";
import type { MiddlewareHandler } from "hono";
import { endTime, startTime } from "hono/timing";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  createConsoleLoggerAdapter,
  type AuthAdapter,
  type LoggerAdapter,
} from "../adapters/_internal/index.ts";
import type { RouterOptions, StoryBookerUser } from "../types.ts";
import type { ErrorParser } from "../utils/error.ts";
import { DEFAULT_LOCALE } from "./constants.ts";

export interface Store extends RouterOptions<StoryBookerUser> {
  abortSignal: AbortSignal | undefined;
  errorParser?: ErrorParser;
  headers: SuperHeaders;
  locale: string;
  logger: LoggerAdapter;
  prefix: string;
  request: Request;
  url: string;
  user: StoryBookerUser | null | undefined;
}

export const localStore = new AsyncLocalStorage<Store>();

export function getStore(): Store {
  const value = localStore.getStore();
  if (!value) {
    throw new Error("Store not found.");
  }

  return value;
}

export function getStoreOrNull(): Store | null {
  const value = localStore.getStore();
  if (!value) {
    return null;
  }

  return value;
}

export function setupStore<User extends StoryBookerUser>(
  options: RouterOptions<User>,
  initPromises: Promise<unknown>,
): MiddlewareHandler {
  return async (ctx, next) => {
    const logger = options.logger ?? createConsoleLoggerAdapter();

    startTime(ctx, "init-adapters", "Initialize adapters");
    await initPromises;
    endTime(ctx, "init-adapters");

    const request = ctx.req.raw;
    const headers = new SuperHeaders(request.headers);
    const locale = headers.acceptLanguage.languages[0] ?? DEFAULT_LOCALE;

    startTime(ctx, "get-user", "Get user details");
    const user = await options.auth?.getUserDetails({
      logger,
      request: request.clone(),
    });
    endTime(ctx, "get-user");

    startTime(ctx, "request-handler", "Handle request");
    localStore.enterWith({
      ...options,
      abortSignal: request.signal,
      auth: options.auth as AuthAdapter | undefined,
      headers,
      locale,
      logger,
      prefix: options.config?.prefix ?? "",
      request,
      url: request.url,
      user,
    });

    await next();
    endTime(ctx, "request-handler");
  };
}
