import type { UIAdapterOptions } from "../adapters/ui";
import { getStore } from "./store";

export function createUIAdapterOptions(): UIAdapterOptions {
  const { auth, locale, logger, url, user } = getStore();

  return {
    isAuthEnabled: !!auth,
    locale,
    logger,
    url,
    user,
  };
}
