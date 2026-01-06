import { AsyncLocalStorage } from "node:async_hooks";
import type { UIAdapterOptions } from "storybooker/adapter/ui";
import type { UrlBuilder } from "storybooker/types";
import type { BasicUIOptions } from "../index.tsx";

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
  handler: (props: NoInfer<Props>) => NoInfer<Return>,
): (props: Props, adapterOptions: UIAdapterOptions) => Return {
  return (props, adapterOptions) => {
    const store: UIStore = adapterOptions;
    store.logo = options.logo;
    uiStoreContext.enterWith(store);

    return handler(props);
  };
}
