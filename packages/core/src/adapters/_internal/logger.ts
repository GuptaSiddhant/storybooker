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

/**
 * Logger adapter that logs to console.
 */
export const consoleLoggerAdapter: LoggerAdapter = {
  metadata: {
    name: "console",
    description: "Logger that outputs to the console.",
  },

  debug: console.debug.bind(console),
  error: console.error.bind(console),
  log: console.log.bind(console),
};
