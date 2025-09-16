import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import type { StorageService } from "@storybooker/core";

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

  createContainer = async (name: string): Promise<void> => {
    await fsp.mkdir(this.#genPath(name), { recursive: true });
  };

  deleteContainer = async (name: string): Promise<void> => {
    await fsp.rm(this.#genPath(name), { force: true, recursive: true });
  };

  listContainers = async (): Promise<string[]> => {
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

  deleteFile = async (name: string, path: string): Promise<void> => {
    await fsp.rm(this.#genPath(name, path));
  };

  deleteFiles = async (name: string, prefix: string): Promise<void> => {
    await fsp.rm(this.#genPath(name, prefix), { force: true, recursive: true });
  };

  downloadFile = async (
    containerName: string,
    filepath: string,
  ): Promise<string> => {
    const path = this.#genPath(containerName, filepath);
    return await fsp.readFile(path, { encoding: "utf8" });
  };

  uploadFile = async (
    containerName: string,
    file: Blob | string | ReadableStream,
    options: { mimeType: string; destinationPath: string },
  ): Promise<void> => {
    const { destinationPath } = options;
    const finalPath = this.#genPath(containerName, destinationPath);

    const data =
      typeof file === "string"
        ? file
        : Readable.fromWeb(
            (file instanceof Blob ? file.stream() : file) as WebReadableStream,
          );
    await fsp.writeFile(finalPath, data, { encoding: "utf8" });
  };

  uploadDir = async (
    containerName: string,
    dirpath: string,
    destPrefix?: string,
  ): Promise<void> => {
    const toDirpath = this.#genPath(containerName, destPrefix);
    await fsp.cp(dirpath, toDirpath, { recursive: true });
  };
}
