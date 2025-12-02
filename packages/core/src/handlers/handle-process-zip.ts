import { Buffer } from "node:buffer";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import decompress from "decompress";
import type { StoryBookerFile } from "../adapters/storage";
import { BuildsModel } from "../models/builds-model";
import type { BuildUploadVariant } from "../models/builds-schema";
import { generateStorageContainerId } from "../utils/adapter-utils";
import { writeStreamToFile } from "../utils/file-utils";
import { getMimeType } from "../utils/mime-utils";
import { getStore } from "../utils/store";

export async function handleProcessZip(
  projectId: string,
  buildId: string,
  variant: BuildUploadVariant,
): Promise<void> {
  const { abortSignal, logger, storage } = getStore();
  const debugLog = (...args: unknown[]): void => {
    logger.log(`(${projectId}-${buildId}-${variant})`, ...args);
  };

  debugLog("Creating temp dir");
  const localDirpath = fs.mkdtempSync(
    path.join(os.tmpdir(), `storybooker-${projectId}-${buildId}-`),
  );
  const localZipFilePath = path.join(localDirpath, `${variant}.zip`);
  const outputDirpath = path.join(localDirpath, variant);

  const containerId = generateStorageContainerId(projectId);
  const buildIdModel = new BuildsModel(projectId).id(buildId);

  try {
    await buildIdModel.update({ [variant]: "processing" });

    debugLog("Downloading zip file");
    const file = await storage.downloadFile(containerId, `${buildId}/${variant}.zip`, {
      abortSignal,
      logger,
    });

    if (!file.content) {
      throw new Error("No file content found.");
    }

    if (typeof file.content === "string") {
      await fsp.writeFile(localZipFilePath, file.content);
    } else if (file.content instanceof Blob) {
      const arrayBuffer = await file.content.arrayBuffer();
      await fsp.writeFile(localZipFilePath, Buffer.from(arrayBuffer));
    } else {
      await writeStreamToFile(localZipFilePath, file.content);
    }

    debugLog("Decompress zip file");
    await decompress(localZipFilePath, outputDirpath);

    debugLog("Upload uncompressed dir");
    await storage.uploadFiles(
      containerId,
      await dirpathToFiles(outputDirpath, `${buildId}/${variant}`),
      { abortSignal, logger },
    );

    await buildIdModel.update({ [variant]: "ready" });
  } finally {
    debugLog("Cleaning up temp dir");
    await fsp.rm(localDirpath, { force: true, recursive: true }).catch(logger.error);
  }

  return;
}

async function dirpathToFiles(dirpath: string, prefix: string): Promise<StoryBookerFile[]> {
  const allEntriesInDir = await fsp.readdir(dirpath, {
    encoding: "utf8",
    recursive: true,
    withFileTypes: true,
  });
  const allFilesInDir = allEntriesInDir
    .filter((file) => file.isFile() && !file.name.startsWith("."))
    .map((file) => path.join(file.parentPath, file.name));

  return allFilesInDir.map((filepath): StoryBookerFile => {
    const relativePath = filepath.replace(`${dirpath}/`, "");
    const content = createWebReadableStream(filepath);

    return {
      content,
      mimeType: getMimeType(filepath),
      path: path.posix.join(prefix, relativePath),
    };
  });
}

function createWebReadableStream(filepath: string): ReadableStream {
  const readStream = fs.createReadStream(filepath);

  return new ReadableStream({
    cancel() {
      readStream.destroy();
    },
    start(controller) {
      readStream.on("data", (chunk) => {
        controller.enqueue(chunk);
      });

      readStream.on("end", () => {
        controller.close();
      });

      readStream.on("error", (error) => {
        controller.error(error);
      });
    },
  });
}
