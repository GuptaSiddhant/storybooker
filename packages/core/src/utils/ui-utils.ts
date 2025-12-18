import type { UIAdapterOptions } from "../adapters/ui.ts";
import { getStore } from "./store.ts";

export function createUIAdapterOptions(): UIAdapterOptions {
  const { auth, database, storage, ui, locale, logger, url, user } = getStore();

  return {
    isAuthEnabled: Boolean(auth),
    locale,
    logger,
    url,
    user,
    adaptersMetadata: {
      auth: auth?.metadata,
      database: database?.metadata,
      logger: logger?.metadata,
      storage: storage?.metadata,
      ui: ui?.metadata,
    },
  };
}
