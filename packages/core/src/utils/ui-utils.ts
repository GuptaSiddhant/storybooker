import type { Context } from "hono";
import type { UIAdapterOptions, UIResult } from "../adapters/_internal/ui.ts";
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

// oxlint-disable-next-line max-params
export function createUIResultResponse<Props>(
  ctx: Context,
  render: (props: Props, options: UIAdapterOptions) => UIResult,
  props: NoInfer<Props>,
  init?: ResInit,
): Promise<Response> {
  return uiResultResponse(ctx, render(props, createUIAdapterOptions()), init);
}

export async function uiResultResponse(
  ctx: Context,
  result: UIResult,
  init?: ResInit,
): Promise<Response> {
  if (result instanceof Promise) {
    const awaitedResult = await result;
    if (awaitedResult instanceof Response) {
      return awaitedResult;
    }

    return ctx.html(awaitedResult);
  }

  if (result instanceof Response) {
    return result;
  }

  return ctx.html(result, init);
}

type ResInit = Parameters<Context["html"]>[1];
