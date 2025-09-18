import { AsyncLocalStorage } from "node:async_hooks";
import type { CustomErrorParser } from "#utils/error";
import type { Translation } from "../translations";
import type {
  AuthService,
  BrandingOptions,
  DatabaseService,
  LoggerService,
  OpenAPIOptions,
  StorageService,
  StoryBookerUser,
} from "../types";

export interface Store {
  auth: AuthService | undefined;
  branding: BrandingOptions | undefined;
  customErrorParser: CustomErrorParser | undefined;
  database: DatabaseService;
  headless: boolean;
  locale: string;
  logger: LoggerService;
  openAPI?: OpenAPIOptions | undefined | null;
  prefix: string;
  request: Request;
  storage: StorageService;
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
