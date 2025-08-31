// oxlint-disable no-undef
// oxlint-disable explicit-module-boundary-types
// oxlint-disable explicit-function-return-type
// oxlint-disable require-await

import type { StorageService } from "../packages/core/dist/index.d.ts";

const prefix = [".", "server", "files"];
function genPath(...pathParts: (string | undefined)[]): string {
  return [...prefix, ...pathParts].filter(Boolean).join("/");
}

export class LocalStorage implements StorageService {
  createContainer = async (name: string) => {
    await Deno.mkdir(genPath(name), { recursive: true });
  };
  deleteContainer = async (name: string): Promise<void> => {
    await Deno.remove(genPath(name), { recursive: true });
  };
  listContainers = async (): Promise<string[]> => {
    const containers: string[] = [];
    for await (const entry of Deno.readDir(genPath())) {
      if (entry.isDirectory) {
        containers.push(entry.name);
      }
    }
    return containers;
  };
  deleteFile = async (name: string, path: string): Promise<void> => {
    await Deno.remove(genPath(name, path));
  };
  deleteFiles = async (name: string, prefix: string): Promise<void> => {
    await Deno.remove(genPath(name, prefix), { recursive: true });
  };
  uploadFile = async (
    containerName: string,
    file: Blob | string | ReadableStream,
    options: { mimeType: string; destinationPath: string },
  ): Promise<void> => {
    const { destinationPath } = options;
    const finalPath = genPath(containerName, destinationPath);

    if (typeof file === "string") {
      await Deno.copyFile(file, finalPath);
    } else {
      await Deno.writeFile(
        finalPath,
        file instanceof Blob ? await file.bytes() : file,
      );
    }
  };
  uploadDir = async (
    containerName: string,
    dirpath: string,
    destPrefix?: string,
  ): Promise<void> => {
    const toDirpath = genPath(containerName, destPrefix);
    await copyDir(dirpath, toDirpath);
  };

  downloadFile = async (
    containerName: string,
    filepath: string,
  ): Promise<string> => {
    const path = genPath(containerName, filepath);
    return await Deno.readTextFile(path);
  };
}

async function copyDir(
  fromDirpath: string,
  toDirpath: string,
  root = fromDirpath,
) {
  await Deno.mkdir(toDirpath, { recursive: true });

  for await (const entry of Deno.readDir(fromDirpath)) {
    const fromFilepath = [fromDirpath, entry.name].join("/");
    const toFilepath = [toDirpath, entry.name].join("/");
    if (entry.isFile) {
      await Deno.copyFile(fromFilepath, toFilepath);
    } else if (entry.isDirectory) {
      await copyDir(fromFilepath, toFilepath, root);
    }
  }
}
