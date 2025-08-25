import type { Logger } from "@storybooker/router/types";
import type { InvocationContext } from "@azure/functions";

const PROPERTIES_TO_SANITISE: RegExp[] = [/x-functions-key/i];
const PATTERNS_TO_SANITISE: [RegExp, string][] = [
  [/token=[^&]+/gi, "token=*****"], // Storyblok API token
];

export class AzureFunctionLogger implements Logger {
  #context: InvocationContext;
  #customLogger: Logger | undefined;

  constructor(context: InvocationContext, customLogger?: Logger) {
    this.#context = context;
    this.#customLogger = customLogger;
  }

  log = (...args: unknown[]): void => {
    const sanitisedMessages = sanitiseArray(args);
    this.#context.log(...sanitisedMessages);
    this.#customLogger?.log(...sanitisedMessages);
  };

  info = (...args: unknown[]): void => {
    const sanitisedMessages = sanitiseArray(args);
    this.#context.info(...sanitisedMessages);
    this.#customLogger?.info?.(...sanitisedMessages);
  };

  debug = (...args: unknown[]): void => {
    const sanitisedMessages = sanitiseArray(args);
    this.#context.debug(...sanitisedMessages);
    this.#customLogger?.debug?.(...sanitisedMessages);
  };

  trace = (...args: unknown[]): void => {
    const sanitisedMessages = sanitiseArray(args);
    this.#context.trace(...sanitisedMessages);
    this.#customLogger?.trace?.(...sanitisedMessages);
  };

  warn = (...args: unknown[]): void => {
    const sanitisedMessages = sanitiseArray(args);
    this.#context.warn(...sanitisedMessages);
    this.#customLogger?.warn?.(...sanitisedMessages);
  };

  error = (...args: unknown[]): void => {
    const sanitisedMessages = sanitiseArray(args);
    this.#context.error(...sanitisedMessages);
    this.#customLogger?.error(...sanitisedMessages);
  };
}

function sanitiseArray(arr: unknown[]): unknown[] {
  return arr.map((value) => sanitiseObject(value));
}

function sanitiseObject(input: unknown, key?: string): unknown {
  if (!input) {
    return "";
  }

  if (typeof input === "string") {
    if (key) {
      for (const pattern of PROPERTIES_TO_SANITISE) {
        if (pattern.test(key)) {
          input = "*****";
        }
      }
    }
    for (const [pattern, replacement] of PATTERNS_TO_SANITISE) {
      input =
        typeof input === "string" ? input.replace(pattern, replacement) : input;
    }
  }

  if (typeof input === "object" && input !== null) {
    for (const [key, value] of Object.entries(input)) {
      (input as Record<string, unknown>)[key] = sanitiseObject(value, key);
    }
    return input;
  }

  return String(input);
}
