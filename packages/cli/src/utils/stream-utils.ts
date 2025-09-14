// oxlint-disable no-useless-undefined
// oxlint-disable no-nested-ternary

import * as process from "node:process";
import type { Readable } from "node:stream";
import { styleText } from "node:util";

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
