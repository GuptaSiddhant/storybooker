import { AsyncLocalStorage } from "node:async_hooks";
import type { CheckPermissionsCallback, OpenAPIOptions } from "./types";

/**
 * @private
 * Options for linking with Azure Blob Storage
 */
export interface RouterHandlerOptions {
  storageConnectionString: string;
  baseRoute: string;
  staticDirs: readonly string[];
  openAPI: OpenAPIOptions | undefined | null;
  checkPermissions: CheckPermissionsCallback;
}

export interface Store extends RouterHandlerOptions {
  accept: string;
  locale: string;
  request: Request;
}

const localStore = new AsyncLocalStorage<Store>();

export function getStore(): Store {
  const value = localStore.getStore();
  if (!value) {
    throw new Error("Store not found.");
  }

  return value;
}
