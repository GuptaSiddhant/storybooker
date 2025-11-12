// oxlint-disable max-lines-per-function

import { Buffer } from "node:buffer";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import decompress from "decompress";
import { BuildsModel } from "../builds/model";
import type { BuildUploadVariant } from "../builds/schema";
import type { StoryBookerFile } from "../types";
import { writeStreamToFile } from "../utils/file-utils";
import { getMimeType } from "../utils/mime-utils";
import { generateStorageContainerId } from "../utils/shared-model";
import { getStore } from "../utils/store";

export async function handleProcessZip(
  projectId: string,
  buildSHA: string,
  variant: BuildUploadVariant,
): Promise<void> {
  const { abortSignal, logger, storage } = getStore();
  const debugLog = (...args: unknown[]): void => {
    logger.log(`(${projectId}-${buildSHA}-${variant})`, ...args);
  };

  debugLog("Creating temp dir");
  const localDirpath = fs.mkdtempSync(
    path.join(os.tmpdir(), `storybooker-${projectId}-${buildSHA}-`),
  );
  const localZipFilePath = path.join(localDirpath, `${variant}.zip`);
  const outputDirpath = path.join(localDirpath, variant);

  const containerId = generateStorageContainerId(projectId);

  try {
    debugLog("Downloading zip file");
    const file = await storage.downloadFile(
      containerId,
      `${buildSHA}/${variant}.zip`,
      { abortSignal, logger },
    );

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
      await dirpathToFiles(outputDirpath, `${buildSHA}/${variant}`),
      { abortSignal, logger },
    );

    await new BuildsModel(projectId).update(buildSHA, { [variant]: "ready" });
  } finally {
    debugLog("Cleaning up temp dir");
    await fsp
      .rm(localDirpath, { force: true, recursive: true })
      .catch(logger.error);
  }

  return;
}

async function dirpathToFiles(
  dirpath: string,
  prefix: string,
): Promise<StoryBookerFile[]> {
  const { ui } = getStore();

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
    const content =
      ui?.streaming === false
        ? fs.readFileSync(filepath, { encoding: "binary" })
        : (Readable.toWeb(
            fs.createReadStream(filepath, { encoding: "binary" }),
          ) as ReadableStream);

    return {
      content,
      mimeType: getMimeType(filepath),
      path: path.posix.join(prefix, relativePath),
    };
  });
}
