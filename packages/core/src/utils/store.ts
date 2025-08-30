import { AsyncLocalStorage } from "node:async_hooks";
import type { CustomErrorParser } from "#utils/error";
import type {
  CheckPermissionsCallback,
  DatabaseService,
  LoggerService,
  OpenAPIOptions,
  StorageService,
} from "../types";

export interface Store {
  prefix: string;
  openAPI?: OpenAPIOptions | undefined | null;
  checkPermissions: CheckPermissionsCallback;
  customErrorParser: CustomErrorParser | undefined;
  locale: string;
  request: Request;
  logger: LoggerService;
  headless: boolean;
  database: DatabaseService;
  storage: StorageService;
  url: string;
}

export const localStore = new AsyncLocalStorage<Store>();

export function getStore(): Store {
  const value = localStore.getStore();
  if (!value) {
    throw new Error("Store not found.");
  }

  return value;
}
