import type { Context } from "hono";
import type { UIAdapterOptions, UIResult } from "../adapters/ui.ts";
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

export async function createUIResultResponse<Props>(
  ctx: Context,
  render: (props: Props, options: UIAdapterOptions) => UIResult,
  props: NoInfer<Props>,
): Promise<Response> {
  let result = render(props, createUIAdapterOptions());

  if (result instanceof Promise) {
    result = await result;
    if (result instanceof Response) {
      return result;
    }

    return ctx.html(result);
  }

  if (result instanceof Response) {
    return result;
  }

  return ctx.html(result);
}
