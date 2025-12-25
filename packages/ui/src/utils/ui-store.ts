import { AsyncLocalStorage } from "node:async_hooks";
import type { UIAdapterOptions } from "storybooker/~internal/adapter/ui";
import { UrlBuilder } from "storybooker/~internal/url";
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
  handler: (props: NoInfer<Props>) => Return,
): (props: Props, adapterOptions: UIAdapterOptions) => Return {
  return (props, adapterOptions) => {
    uiStoreContext.enterWith({
      ...adapterOptions,
      urlBuilder: new UrlBuilder(false),
      logo: options.logo,
    });

    const result = handler(props);

    return result;
  };
}
