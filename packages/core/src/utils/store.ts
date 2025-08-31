import { AsyncLocalStorage } from "node:async_hooks";
import type { CustomErrorParser } from "#utils/error";
import type {
  AuthService,
  DatabaseService,
  LoggerService,
  OpenAPIOptions,
  StorageService,
  User,
} from "../types";

export interface Store {
  auth: AuthService | undefined;
  database: DatabaseService;
  logger: LoggerService;
  storage: StorageService;

  prefix: string;
  openAPI?: OpenAPIOptions | undefined | null;
  customErrorParser: CustomErrorParser | undefined;
  locale: string;
  request: Request;
  headless: boolean;
  url: string;
  user?: User;
}

export const localStore = new AsyncLocalStorage<Store>();

export function getStore(): Store {
  const value = localStore.getStore();
  if (!value) {
    throw new Error("Store not found.");
  }

  return value;
}
