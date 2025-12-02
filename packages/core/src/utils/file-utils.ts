import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

export async function writeStreamToFile(
  filePath: string,
  stream: Readable | ReadableStream,
): Promise<void> {
  const writable = createWriteStream(filePath);
  const readable =
    stream instanceof Readable ? stream : Readable.fromWeb(stream as WebReadableStream);
  for await (const chunk of readable) {
    if (!writable.write(chunk)) {
      // Wait if backpressure is applied
      await once(writable, "drain");
    }
  }
  writable.end();
  await once(writable, "finish");
}

export function writeWebStreamToFile(
  webReadableStream: ReadableStream,
  outputPath: string,
): Promise<null> {
  // Convert WebReadableStream to Node.js Readable stream
  const nodeReadableStream = Readable.fromWeb(webReadableStream as WebReadableStream);

  // Create a writable file stream
  const fileWritableStream = createWriteStream(outputPath);

  // Pipe the Node.js readable stream to the writable file stream
  nodeReadableStream.pipe(fileWritableStream);

  // Return a promise that resolves when writing is finished
  return new Promise((resolve, reject) => {
    fileWritableStream.on("finish", () => {
      resolve(null);
    });
    fileWritableStream.on("error", reject);
  });
}
