import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

export async function writeStreamToFile(
  filePath: string,
  stream: Readable | ReadableStream,
): Promise<void> {
  const writable = createWriteStream(filePath);
  const readable =
    stream instanceof Readable
      ? stream
      : Readable.fromWeb(stream as NodeReadableStream);
  for await (const chunk of readable) {
    if (!writable.write(chunk)) {
      // Wait if backpressure is applied
      await once(writable, "drain");
    }
  }
  writable.end();
  await once(writable, "finish");
}
