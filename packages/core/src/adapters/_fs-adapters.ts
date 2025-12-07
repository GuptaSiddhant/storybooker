// oxlint-disable no-await-in-loop
// oxlint-disable max-params
// oxlint-disable require-await
// oxlint-disable no-unsafe-assignment

import type { Buffer } from "node:buffer";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { Readable, type Stream } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import {
  DatabaseAdapterErrors,
  StorageAdapterErrors,
  type DatabaseAdapter,
  type DatabaseAdapterOptions,
  type StorageAdapter,
  type StoryBookerDatabaseDocument,
} from "./index";

/**
 * Database adapter for StoryBooker while uses a file (json) in
 * the local filesystem to read from and write entries to.
 * It uses NodeJS FS API to read/write to filesystem.
 *
 * It is useful for testing and playground
 * but not recommended for heavy traffic.
 *
 * Usage:
 * ```ts
 * const database = createLocalFileDatabaseAdapter("./db.json");
 * ```
 */
export function createLocalFileDatabaseAdapter(filename = "db.json"): DatabaseAdapter {
  const filepath = path.resolve(filename);
  let db: Record<string, Record<string, StoryBookerDatabaseDocument>> | undefined = undefined;

  const readFromFile = async (options: DatabaseAdapterOptions): Promise<void> => {
    try {
      const newDB = await fsp.readFile(filepath, {
        encoding: "utf8",
        signal: options.abortSignal,
      });
      db = newDB ? JSON.parse(newDB) : {};
    } catch {
      db = {};
    }
  };

  const saveToFile = async (options: DatabaseAdapterOptions): Promise<void> => {
    if (!db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    await fsp.writeFile(filepath, JSON.stringify(db, null, 2), {
      encoding: "utf8",
      signal: options.abortSignal,
    });
  };

  return {
    metadata: {
      name: "Local File",
      description: "A file based database stored in a single JSON file.",
    },

    async init(options) {
      if (fs.existsSync(filepath)) {
        const stat = await fsp.stat(filepath);
        if (stat.isFile()) {
          await readFromFile(options);
        } else {
          throw new DatabaseAdapterErrors.DatabaseNotInitializedError(
            `Path "${filepath}" is not a file`,
          );
        }
      } else {
        db = {}; // Initialize empty DB
        const basedir = path.dirname(filepath);
        await fsp.mkdir(basedir, { recursive: true }).catch(() => {
          // ignore error
        });
        await saveToFile(options);
      }
    },

    // Collections

    async createCollection(collectionId, options) {
      if (!db) {
        throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
      }

      if (Object.hasOwn(db, collectionId)) {
        throw new DatabaseAdapterErrors.CollectionAlreadyExistsError(collectionId);
      }

      if (!db[collectionId]) {
        db[collectionId] = {};
      }
      await saveToFile(options);
    },

    async listCollections() {
      if (!db) {
        throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
      }

      return Object.keys(db);
    },

    async deleteCollection(collectionId, options) {
      if (!db) {
        throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
      }

      if (!Object.hasOwn(db, collectionId)) {
        throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
      }

      // oxlint-disable-next-line no-dynamic-delete
      delete db[collectionId];
      await saveToFile(options);
    },

    async hasCollection(collectionId, _options) {
      if (!db) {
        throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
      }

      return Object.hasOwn(db, collectionId);
    },

    // Documents

    async listDocuments(collectionId, listOptions, _options) {
      if (!db) {
        throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
      }

      if (!Object.hasOwn(db, collectionId)) {
        throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
      }

      const { limit = Number.POSITIVE_INFINITY, sort, filter } = listOptions || {};

      // oxlint-disable-next-line no-non-null-assertion
      const collection = db[collectionId]!;
      const items = Object.values(collection);
      if (sort) {
        if (typeof sort === "function") {
          items.sort(sort);
        } else if (sort === "latest") {
          items.sort((itemA, itemB) => {
            return new Date(itemB.updatedAt).getTime() - new Date(itemA.updatedAt).getTime();
          });
        }
      }

      if (filter && typeof filter === "function") {
        return items.filter((item) => filter(item)).slice(0, limit);
      }

      return items.slice(0, limit);
    },

    async getDocument(collectionId, documentId, _options) {
      if (!db) {
        throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
      }

      if (!Object.hasOwn(db, collectionId)) {
        throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
      }

      const item = db[collectionId]?.[documentId];
      if (!item) {
        throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
      }

      return item;
    },

    async hasDocument(collectionId, documentId, options) {
      return !!(await this.getDocument(collectionId, documentId, options));
    },

    async createDocument(collectionId, documentData, options) {
      if (!db) {
        throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
      }

      if (!Object.hasOwn(db, collectionId)) {
        throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
      }

      // oxlint-disable-next-line no-non-null-assertion
      const collection = db[collectionId]!;
      if (collection[documentData.id]) {
        throw new DatabaseAdapterErrors.DocumentAlreadyExistsError(collectionId, documentData.id);
      }

      collection[documentData.id] = documentData;
      await saveToFile(options);
    },

    async deleteDocument(collectionId, documentId, options) {
      if (!db) {
        throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
      }

      if (!Object.hasOwn(db, collectionId)) {
        throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
      }

      if (!(await this.hasDocument(collectionId, documentId, options))) {
        throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
      }

      // oxlint-disable-next-line no-non-null-assertion
      const collection = db[collectionId]!;
      // oxlint-disable-next-line no-dynamic-delete
      delete collection[documentId];
      await saveToFile(options);
    },

    async updateDocument(collectionId, documentId, documentData, options) {
      if (!db) {
        throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
      }

      if (!Object.hasOwn(db, collectionId)) {
        throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
      }

      const prevItem = await this.getDocument(collectionId, documentId, options);
      if (!prevItem) {
        throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
      }

      // oxlint-disable-next-line no-non-null-assertion
      const collection = db[collectionId]!;
      collection[documentId] = { ...prevItem, ...documentData, id: documentId };
      await saveToFile(options);
    },
  };
}

/**
 * Storage adapter for StoryBooker while uses
 * the local filesystem to read from and write files to.
 * It uses NodeJS FS API to read/write to filesystem.
 *
 * It is useful for testing and playground
 * but not recommended for heavy traffic.
 *
 * Usage:
 * ```ts
 * const storage = createLocalFileStorageAdapter("./store/");
 * ```
 */
export function createLocalFileStorageAdapter(pathPrefix = "."): StorageAdapter {
  const basePath = path.resolve(pathPrefix);

  function genPath(...pathParts: (string | undefined)[]): string {
    return path.join(basePath, ...pathParts.filter((part) => part !== undefined));
  }

  // Containers

  return {
    metadata: {
      name: "Local File System",
      description: "A storage adapter that uses the local file system to store files.",
    },

    init: async (_options) => {
      try {
        await fsp.mkdir(basePath, { recursive: true });
      } catch (error) {
        throw new StorageAdapterErrors.StorageNotInitializedError({ cause: error });
      }
    },

    async createContainer(containerId, options) {
      if (await this.hasContainer(containerId, options)) {
        throw new StorageAdapterErrors.ContainerAlreadyExistsError(containerId);
      }

      await fsp.mkdir(genPath(containerId), { recursive: true });
    },

    async deleteContainer(containerId, options) {
      if (!(await this.hasContainer(containerId, options))) {
        throw new StorageAdapterErrors.ContainerDoesNotExistError(containerId);
      }

      await fsp.rm(genPath(containerId), { force: true, recursive: true });
    },

    async hasContainer(containerId) {
      return fs.existsSync(genPath(containerId));
    },

    async listContainers() {
      const dirPath = genPath();
      if (!fs.existsSync(dirPath)) {
        throw new StorageAdapterErrors.StorageNotInitializedError(
          `Dir "${dirPath}" does not exist`,
        );
      }

      const containers: string[] = [];
      const entries = await fsp.readdir(dirPath, {
        withFileTypes: true,
      });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          containers.push(entry.name);
        }
      }
      return containers;
    },

    // Files

    async deleteFiles(containerId, filePathsOrPrefix) {
      if (typeof filePathsOrPrefix === "string") {
        await fsp.rm(genPath(containerId, filePathsOrPrefix), {
          force: true,
          recursive: true,
        });
      } else {
        for (const filepath of filePathsOrPrefix) {
          // oxlint-disable-next-line no-await-in-loop
          await fsp.rm(filepath, { force: true, recursive: true });
        }
      }
    },

    async hasFile(containerId, filepath) {
      const path = genPath(containerId, filepath);
      return fs.existsSync(path);
    },

    async downloadFile(containerId, filepath, options) {
      if (!(await this.hasFile(containerId, filepath, options))) {
        throw new StorageAdapterErrors.FileDoesNotExistError(containerId, filepath);
      }

      const path = genPath(containerId, filepath);
      const buffer = await fsp.readFile(path);
      const content = new Blob([buffer as Buffer<ArrayBuffer>]);
      return { content, path };
    },

    async uploadFiles(containerId, files, options) {
      for (const file of files) {
        const filepath = genPath(containerId, file.path);
        const dirpath = path.dirname(filepath);

        await fsp.mkdir(dirpath, { recursive: true });
        if (file.content instanceof ReadableStream) {
          await writeWebStreamToFile(file.content, filepath);
        } else {
          const data: string | Stream =
            // oxlint-disable-next-line no-nested-ternary
            typeof file.content === "string" ? file.content : await file.content.text();

          await fsp.writeFile(filepath, data, {
            encoding: "utf8",
            signal: options.abortSignal,
          });
        }
      }
    },
  };
}

function writeWebStreamToFile(
  webReadableStream: ReadableStream,
  outputPath: string,
): Promise<null> {
  // Convert WebReadableStream to Node.js Readable stream
  const nodeReadableStream = Readable.fromWeb(webReadableStream as WebReadableStream);

  // Create a writable file stream
  const fileWritableStream = fs.createWriteStream(outputPath);

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
