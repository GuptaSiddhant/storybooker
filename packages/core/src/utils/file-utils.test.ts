import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { writeStreamToFile, writeWebStreamToFile } from "./file-utils.ts";

describe("writeStreamToFile", () => {
  it("should work with node-readable", async () => {
    const dirpath = fs.mkdtempSync(path.join(os.tmpdir(), "file-utils-test"));
    const filepath = path.join(dirpath, "output.txt");

    const data = ["hello", "world"];
    const readable = Readable.from(data);
    await writeStreamToFile(filepath, readable);

    const fileContent = fs.readFileSync(filepath, "utf8");
    expect(fileContent).toBe(data.join(""));
    fs.rmSync(dirpath, { recursive: true, force: true });
  });

  it("should work with web-readable", async () => {
    const dirpath = fs.mkdtempSync(path.join(os.tmpdir(), "file-utils-test"));
    const filepath = path.join(dirpath, "output.txt");

    const data = ["hello", "world"];

    const readable = readableStreamFromArray(data);
    await writeStreamToFile(filepath, readable);

    const fileContent = fs.readFileSync(filepath, "utf8");
    expect(fileContent).toBe(data.join(""));
    fs.rmSync(dirpath, { recursive: true, force: true });
  });
});

describe("writeWebStreamToFile", () => {
  it("should work", async () => {
    const dirpath = fs.mkdtempSync(path.join(os.tmpdir(), "file-utils-test"));
    const filepath = path.join(dirpath, "output.txt");

    const data = ["hello", "world"];

    const readable = readableStreamFromArray(data);
    await writeWebStreamToFile(readable, filepath);

    const fileContent = fs.readFileSync(filepath, "utf8");
    expect(fileContent).toBe(data.join(""));
    fs.rmSync(dirpath, { recursive: true, force: true });
  });
});

function readableStreamFromArray<Type>(arr: Type[]): ReadableStream<Type> {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < arr.length) {
        controller.enqueue(arr[index]);
        index += 1;
      } else {
        controller.close();
      }
    },
  });
}
