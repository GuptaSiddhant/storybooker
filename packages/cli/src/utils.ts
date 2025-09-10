// oxlint-disable no-useless-undefined
// oxlint-disable no-nested-ternary

import { spawn, type SpawnOptionsWithoutStdio } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { Transform, type Readable } from "node:stream";
import { styleText } from "node:util";
import type { CommandBuilder, Options } from "yargs";
import z from "zod";

declare module "zod" {
  interface GlobalMeta {
    alias?: string[];
  }
}

export function zodSchemaToCommandBuilder(
  objectSchema: z.core.$ZodObject,
): CommandBuilder {
  const builder: CommandBuilder = {};
  for (const [key, schema] of Object.entries(objectSchema._zod.def.shape)) {
    const meta =
      "meta" in schema && typeof schema.meta === "function"
        ? schema.meta()
        : undefined;

    let optional = false;
    try {
      schema["~standard"].validate(undefined);
      optional = true;
    } catch {
      optional = false;
    }

    // @ts-expect-error undefined -> never
    let errorMessage = schema._zod.def.error?.(undefined);
    if (typeof errorMessage === "object") {
      errorMessage = errorMessage?.message;
    }

    builder[key] = {
      alias: meta?.alias,
      // @ts-expect-error find description
      description: schema._zod.def.description ?? schema.description,
      demandOption: optional ? false : (errorMessage ?? true),
      type: zodSchemaTypeToYargsBuilderType(schema),
    };
  }

  return builder;
}

function zodSchemaTypeToYargsBuilderType(
  schema: z.core.$ZodType,
): Options["type"] {
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

const childProcessLogOutputTransform = new Transform({
  transform(chunk: Buffer, _encoding, callback): void {
    callback(
      null,
      chunk
        .toString("utf8")
        .split("\n")
        .map((line: string) => (line ? styleText("dim", `  ${line}`) : ""))
        .join("\n"),
    );
  },
});

export function spawnPromise(
  command: string,
  args: readonly string[],
  options: SpawnOptionsWithoutStdio = {},
): Promise<string> {
  const isPipe = options.stdio === "pipe";
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    const errors: string[] = [];
    const outputs: string[] = [];
    const stderrs: string[] = [];

    if (isPipe) {
      child.stdout.pipe(childProcessLogOutputTransform).pipe(process.stdout);
    }

    child.stdout.on("data", (data: Buffer) => {
      outputs.push(data.toString());
    });
    child.stderr.on("data", (data: Buffer) => {
      stderrs.push(data.toString());
    });
    child.on("error", (error) => {
      errors.push(error.message);
    });

    child.on("close", () => {
      if (errors.length > 0) {
        return reject(errors.join(""));
      }

      if (child.exitCode !== 0) {
        return reject(
          new Error(`The program exited with error code ${child.exitCode}.`, {
            cause: new Error(stderrs.join("")),
          }),
        );
      }

      return resolve(outputs.join(""));
    });
  });
}

export type PkgManager = "npm" | "yarn" | "pnpm" | "bun";
export function detectPackageManager(
  startDir: string = process.cwd(),
  maxDepth = 5,
): PkgManager {
  let currentDir = startDir;
  let depth = 0;

  while (depth < maxDepth) {
    if (fs.existsSync(path.join(currentDir, `yarn.lock`))) {
      return "yarn";
    }
    if (fs.existsSync(path.join(currentDir, `pnpm-lock.yaml`))) {
      return "pnpm";
    }
    if (fs.existsSync(path.join(currentDir, `package-lock.json`))) {
      return "npm";
    }
    if (fs.existsSync(path.join(currentDir, `bun.lock`))) {
      return "bun";
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  throw new Error("Package manager could not be determined.");
}

export function toReadableStream(
  readable: Readable,
  filesize: number,
  onProgress: (uploaded: number, total: number) => void = onUploadProgress,
): ReadableStream {
  let uploaded = 0;

  return new ReadableStream({
    start: (controller) => {
      // oxlint-disable-next-line no-explicit-any
      function onData(chunk: any): void {
        try {
          uploaded += chunk.length;
          controller.enqueue(chunk);
          onProgress?.(uploaded, filesize);
        } catch {
          // If controller is closed, remove listeners and destroy stream
          cleanup();
          readable.destroy();
        }
      }

      function onEnd(): void {
        cleanup();
        controller.close();
      }

      function onError(err: Error): void {
        cleanup();
        controller.error(err);
      }

      function cleanup(): void {
        readable.off("data", onData);
        readable.off("end", onEnd);
        readable.off("error", onError);

        console.log("");
      }

      readable.on("data", onData);
      readable.on("end", onEnd);
      readable.on("error", onError);
    },

    cancel: () => {
      readable.destroy();
    },
  });
}

/** Function to handle upload progress */
export function onUploadProgress(uploaded: number, total: number): void {
  const percent = ((uploaded / total) * 100).toFixed(2);
  const percentStr = percent.padStart(6, " ");
  const totalStr = (total / 1000).toFixed(2);
  const uploadedStr = (uploaded / 1000)
    .toFixed(2)
    .padStart(totalStr.length, " ");
  process.stdout.write(
    styleText(
      "dim",
      `\r  - Uploaded: ${uploadedStr} / ${totalStr} KB (${percentStr}%)`,
    ),
  );
}
