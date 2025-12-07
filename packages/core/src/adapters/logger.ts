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
  metadata?: { name: string };
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
