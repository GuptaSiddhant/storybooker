// oxlint-disable no-useless-undefined

import type { CommandBuilder, Options } from "yargs";
import z from "zod";

declare module "zod" {
  interface GlobalMeta {
    alias?: string[];
    hidden?: boolean;
    implies?: string;
  }
}

export const sharedSchemas = {
  project: z.string({ error: "ProjectID is required to match with project." }).meta({
    alias: ["p"],
    description: "Project ID associated with the StoryBook.",
  }),
  url: z.url({ error: "URL is required to connect to the service." }).meta({
    alias: ["u"],
    description: "URL of the StoryBooker service.",
  }),
  cwd: z.string().optional().meta({ description: "Change the working directory for the command." }),

  testReportDir: z.string().optional().meta({
    description: "Relative path of the test report directory to upload.",
  }),
  testCoverageDir: z.string().optional().meta({
    description: "Relative path of the test coverage directory to upload.",
  }),

  authType: z
    .enum(["auth-header"])
    .optional()
    .meta({ description: "Enable auth for outgoing requests." }),
  authValue: z.string().optional().meta({
    description: "Auth value set for outgoing requests.",
    implies: "authType",
  }),
};

export function zodSchemaToCommandBuilder(objectSchema: z.core.$ZodObject): CommandBuilder {
  const builder: CommandBuilder = {};
  for (const [key, schema] of Object.entries(objectSchema._zod.def.shape)) {
    const meta = schema instanceof z.ZodType ? schema.meta() : undefined;

    let optional = false;
    try {
      // @ts-expect-error undefined
      const valueOrPromise = schema["~standard"].validate(undefined, {});
      if (valueOrPromise instanceof Promise) {
        throw new TypeError("Cannot handle async schema");
      }
      optional = true;
    } catch {
      optional = false;
    }

    // @ts-expect-error undefined -> never
    let errorMessage = schema._zod.def.error?.(undefined);
    if (typeof errorMessage === "object") {
      errorMessage = errorMessage?.message;
    }

    let defaultValue =
      schema instanceof z.core.$ZodDefault ? schema._zod.def.defaultValue : undefined;
    if (typeof defaultValue === "function") {
      defaultValue = String(defaultValue());
    }

    const description =
      // @ts-expect-error unknown schema
      // oxlint-disable-next-line no-unsafe-assignment
      String(schema._zod.def.description ?? schema.description);

    builder[key] = {
      alias: meta?.alias,
      description,
      demandOption: optional ? false : (errorMessage ?? true),
      type: zodSchemaTypeToYargsBuilderType(schema),
      default: defaultValue,
      deprecated: meta?.deprecated,
      hidden: meta?.hidden,
      implies: meta?.implies,
    };
  }

  return builder;
}

function zodSchemaTypeToYargsBuilderType(schema: z.core.$ZodType): Options["type"] {
  if (schema instanceof z.core.$ZodArray) {
    return "array";
  }
  if (schema instanceof z.core.$ZodBoolean) {
    return "boolean";
  }
  if (schema instanceof z.core.$ZodNumber) {
    return "number";
  }
  if (schema instanceof z.core.$ZodOptional) {
    return zodSchemaTypeToYargsBuilderType(schema._zod.def.innerType);
  }
  if (schema instanceof z.core.$ZodDefault) {
    return zodSchemaTypeToYargsBuilderType(schema._zod.def.innerType);
  }
  if (schema instanceof z.core.$ZodUnion) {
    return undefined;
  }

  return "string";
}
