import { AsyncLocalStorage } from "node:async_hooks";
import type { UIAdapterOptions } from "@storybooker/core/adapter";
import { UrlBuilder } from "@storybooker/core/url";
import type { BasicUIOptions } from "..";

interface UIStore extends UIAdapterOptions {
  logo?: string;
  urlBuilder: UrlBuilder;
}

const uiStoreContext = new AsyncLocalStorage<UIStore>();

export function getUIStore(): UIStore {
  const store = uiStoreContext.getStore();
  if (!store) {
    throw new Error("UI Store not available");
  }
  return store;
}

export function withStore<Props, Return>(
  options: BasicUIOptions,
  handler: (props: NoInfer<Props>) => Return,
): (props: Props, adapterOptions: UIAdapterOptions) => Return {
  return (props, adapterOptions) => {
    uiStoreContext.enterWith({
      ...adapterOptions,
      urlBuilder: new UrlBuilder(false),
      logo: options.logo,
    });

    return handler(props);
  };
}
