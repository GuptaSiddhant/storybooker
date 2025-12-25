import type { StoryBookerAdapterMetadata } from "../../utils/adapter-utils.ts";

// oxlint-disable no-console
/**
 * Service adapter to log to desired destination.
 *
 * The service should contain method to `log` and report `error`.
 * It can optionally have `debug` callback for debug messages.
 *
 * @default NodeJS.console
 */
export interface LoggerAdapter {
  /**
   * Metadata about the adapter.
   */
  metadata: StoryBookerAdapterMetadata;
  /**
   * Optional debug logs
   */
  debug?: (...args: unknown[]) => void;
  /**
   * Error logs
   */
  error: (...args: unknown[]) => void;
  /**
   * Normal logs
   */
  log: (...args: unknown[]) => void;
}

export function createConsoleLoggerAdapter(): LoggerAdapter {
  return {
    metadata: {
      name: "console",
    },

    debug: console.debug.bind(console),
    error: console.error.bind(console),
    log: console.log.bind(console),
  };
}
