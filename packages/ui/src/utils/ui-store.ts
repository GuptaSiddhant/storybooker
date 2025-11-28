import { AsyncLocalStorage } from "node:async_hooks";
import type { UIAdapterOptions } from "@storybooker/core/adapter";
import { UrlBuilder } from "@storybooker/core/url";
import type { BasicUIOptions } from "..";

export interface UIStore extends UIAdapterOptions {
  logo?: string;
  urlBuilder: UrlBuilder;
}

export const uiStore = new AsyncLocalStorage<UIStore>();

export function createUIStore(
  adapterOptions: UIAdapterOptions,
  options: BasicUIOptions,
): UIStore {
  const urlBuilder = new UrlBuilder(adapterOptions.url);
  return { ...adapterOptions, logo: options.logo, urlBuilder };
}

export function getUIStore(): UIStore {
  const store = uiStore.getStore();
  if (!store) {
    throw new Error("UI Store not available");
  }
  return store;
}
