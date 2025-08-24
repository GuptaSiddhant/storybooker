import { AsyncLocalStorage } from "node:async_hooks";
import type {
  HttpRequest,
  HttpHandler,
  HttpResponse,
  HttpResponseInit,
  InvocationContext,
  TimerHandler,
} from "@azure/functions";
import { CONTENT_TYPES, DEFAULT_LOCALE } from "#constants";
import type { CheckPermissionsCallback, OpenAPIOptions } from "#types";

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
  request: HttpRequest;
  context: InvocationContext;
}

const localStore = new AsyncLocalStorage<Store>();

export function getStore(): Store {
  const value = localStore.getStore();
  if (!value) {
    throw new Error("Store not found.");
  }

  return value;
}

export function wrapHttpHandlerWithStore(
  options: RouterHandlerOptions,
  callback: () => Promise<HttpResponseInit | HttpResponse>,
): HttpHandler {
  return async function httpHandler(request, context) {
    const locale =
      request.headers.get("accept-language")?.split(",")[0] ?? DEFAULT_LOCALE;
    const accept = request.headers.get("accept") ?? CONTENT_TYPES.ANY;
    const store: Store = {
      ...options,
      accept,
      context,
      locale,
      request,
    };

    const response = await localStore.run(store, callback);

    return response;
  };
}

export function wrapTimerHandlerWithStore(
  options: RouterHandlerOptions,
  callback: () => Promise<void>,
): TimerHandler {
  return async function timerHandler(_timer, context) {
    const locale = DEFAULT_LOCALE;
    const accept = CONTENT_TYPES.ANY;
    const store: Store = {
      ...options,
      accept,
      context,
      locale,
      request: {} as unknown as HttpRequest,
    };

    await localStore.run(store, callback);
  };
}
