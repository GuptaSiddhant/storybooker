// oxlint-disable no-await-in-loop

import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { Readable, type Stream } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import type { StorageService } from "@storybooker/core/types";

export class LocalFileStorage implements StorageService {
  #basePath: string;

  constructor(pathPrefix = ".") {
    this.#basePath = path.resolve(pathPrefix);
  }

  #genPath(...pathParts: (string | undefined)[]): string {
    return path.join(
      this.#basePath,
      ...pathParts.filter((part) => part !== undefined),
    );
  }

  // Containers

  createContainer: StorageService["createContainer"] = async (
    containerId,
    _options,
  ) => {
    await fsp.mkdir(this.#genPath(containerId), { recursive: true });
  };

  deleteContainer: StorageService["deleteContainer"] = async (containerId) => {
    await fsp.rm(this.#genPath(containerId), { force: true, recursive: true });
  };

  hasContainer: StorageService["hasContainer"] = async (containerId) => {
    return fs.existsSync(this.#genPath(containerId));
  };

  listContainers: StorageService["listContainers"] = async () => {
    const containers: string[] = [];
    const entries = await fsp.readdir(this.#genPath(), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        containers.push(entry.name);
      }
    }
    return containers;
  };

  // Files

  deleteFiles: StorageService["deleteFiles"] = async (
    containerId,
    filePathsOrPrefix,
  ): Promise<void> => {
    if (typeof filePathsOrPrefix === "string") {
      await fsp.rm(this.#genPath(containerId, filePathsOrPrefix), {
        force: true,
        recursive: true,
      });
    } else {
      for (const filepath of filePathsOrPrefix) {
        // oxlint-disable-next-line no-await-in-loop
        await fsp.rm(filepath, { force: true, recursive: true });
      }
    }
  };

  hasFile: StorageService["hasFile"] = async (containerId, filepath) => {
    const path = this.#genPath(containerId, filepath);
    return fs.existsSync(path);
  };

  downloadFile: StorageService["downloadFile"] = async (
    containerId,
    filepath,
  ) => {
    const path = this.#genPath(containerId, filepath);
    const content = await fsp.readFile(path, { encoding: "utf8" });
    return { content, path };
  };

  uploadFiles: StorageService["uploadFiles"] = async (
    containerId,
    files,
    options,
  ) => {
    for (const file of files) {
      const filepath = this.#genPath(containerId, file.path);
      const dirpath = path.dirname(filepath);

      await fsp.mkdir(dirpath, { recursive: true });
      if (file.content instanceof ReadableStream) {
        await writeWebStreamToFile(file.content, filepath);
      } else {
        const data: string | Stream =
          // oxlint-disable-next-line no-nested-ternary
          typeof file.content === "string"
            ? file.content
            : await file.content.text();

        await fsp.writeFile(filepath, data, {
          encoding: "utf8",
          signal: options.abortSignal,
        });
      }
    }
  };
}

async function writeWebStreamToFile(
  webReadableStream: ReadableStream,
  outputPath: string,
): Promise<null> {
  // Convert WebReadableStream to Node.js Readable stream
  const nodeReadableStream = Readable.fromWeb(
    webReadableStream as WebReadableStream,
  );

  // Create a writable file stream
  const fileWritableStream = fs.createWriteStream(outputPath);

  // Pipe the Node.js readable stream to the writable file stream
  nodeReadableStream.pipe(fileWritableStream);

  // Return a promise that resolves when writing is finished
  return new Promise((resolve, reject) => {
    fileWritableStream.on("finish", () => resolve(null));
    fileWritableStream.on("error", reject);
  });
}
