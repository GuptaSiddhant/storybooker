// oxlint-disable no-undef
// oxlint-disable explicit-module-boundary-types
// oxlint-disable explicit-function-return-type
// oxlint-disable require-await

import type { StorageService } from "../packages/core/dist/index.d.ts";

const prefix = [".", "server", "files"];
function genPath(...pathParts: string[]): string {
  return [...prefix, ...pathParts].join("/");
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
    fileOptions?: (filepath: string) => {
      newFilepath: string;
      mimeType: string;
    },
  ): Promise<void> => {
    await copyDir(dirpath, (fp) => {
      const { newFilepath } = fileOptions?.(fp) || {
        mimeType: "application/octet-stream",
        newFilepath: fp,
      };
      return genPath(containerName, newFilepath);
    });
  };

  downloadFile = async (
    containerName: string,
    filepath: string,
  ): Promise<Response> => {
    const path = genPath(containerName, filepath);
    const content = await Deno.readTextFile(path);
    return new Response(content);
  };
}

async function copyDir(
  fromDirpath: string,
  getFilepath: (path: string) => string,
) {
  for await (const entry of Deno.readDir(genPath())) {
    if (entry.isFile) {
      const filepath = [fromDirpath, entry.name].join("/");
      const toFilepath = genPath(getFilepath(filepath));
      await Deno.copyFile(filepath, toFilepath);
    } else if (entry.isDirectory) {
      await copyDir(`${fromDirpath}/${entry.name}`, getFilepath);
    }
  }
}
