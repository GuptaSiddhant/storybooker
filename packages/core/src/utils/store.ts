import { AsyncLocalStorage } from "node:async_hooks";
import type { SuperHeaders } from "@remix-run/headers";
import type { LoggerAdapter } from "../adapters/logger";
import type { RequestHandlerOptions, StoryBookerUser } from "../types";
import type { Translation } from "../ui/translations";

export interface Store
  extends Omit<RequestHandlerOptions<StoryBookerUser>, "staticDirs"> {
  abortSignal: AbortSignal | undefined;
  headers: SuperHeaders;
  locale: string;
  logger: LoggerAdapter;
  prefix: string;
  request: Request;
  translation: Translation;
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
