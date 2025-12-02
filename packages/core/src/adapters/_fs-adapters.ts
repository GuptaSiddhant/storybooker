// oxlint-disable no-await-in-loop
// oxlint-disable max-classes-per-file
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
  type DatabaseDocumentListOptions,
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
 * const database = new LocalFileStorage("./db.json");
 * ```
 */
export class LocalFileDatabase implements DatabaseAdapter {
  #filename: string;
  #db: Record<string, Record<string, StoryBookerDatabaseDocument>> | undefined;

  constructor(filename = "db.json") {
    this.#filename = filename;
  }

  init: DatabaseAdapter["init"] = async (options) => {
    if (fs.existsSync(this.#filename)) {
      await this.#readFromFile(options);
    } else {
      const basedir = path.dirname(this.#filename);
      await fsp.mkdir(basedir, { recursive: true });
      await fsp.writeFile(this.#filename, "{}", {
        encoding: "utf8",
        signal: options.abortSignal,
      });
    }
  };

  listCollections: DatabaseAdapter["listCollections"] = async () => {
    if (!this.#db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    return Object.keys(this.#db);
  };

  createCollection: DatabaseAdapter["createCollection"] = async (
    collectionId,
    options,
  ): Promise<void> => {
    if (!this.#db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    if (Object.hasOwn(this.#db, collectionId)) {
      throw new DatabaseAdapterErrors.CollectionAlreadyExistsError(collectionId);
    }

    if (!this.#db[collectionId]) {
      this.#db[collectionId] = {};
    }
    await this.#saveToFile(options);
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (
    collectionId,
    options,
  ): Promise<void> => {
    if (!this.#db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
    }

    // oxlint-disable-next-line no-dynamic-delete
    delete this.#db[collectionId];
    await this.#saveToFile(options);
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (collectionId, _options) => {
    if (!this.#db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    return Object.hasOwn(this.#db, collectionId);
  };

  listDocuments: DatabaseAdapter["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    listOptions: DatabaseDocumentListOptions<Document>,
    _options: DatabaseAdapterOptions,
  ): Promise<Document[]> => {
    if (!this.#db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
    }

    const { limit = Number.POSITIVE_INFINITY, sort, filter } = listOptions || {};

    // oxlint-disable-next-line no-non-null-assertion
    const collection = this.#db[collectionId]!;
    const items = Object.values(collection) as Document[];
    if (sort && typeof sort === "function") {
      items.sort(sort);
    }
    if (filter && typeof filter === "function") {
      return items.filter((item) => filter(item)).slice(0, limit);
    }

    return items.slice(0, limit);
  };

  getDocument: DatabaseAdapter["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    _options: DatabaseAdapterOptions,
  ): Promise<Document> => {
    if (!this.#db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
    }

    const item = this.#db[collectionId]?.[documentId];
    if (!item) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
    }

    return item as Document;
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (collectionId, documentId, options) => {
    return !!(await this.getDocument(collectionId, documentId, options));
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ): Promise<void> => {
    if (!this.#db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
    }

    // oxlint-disable-next-line no-non-null-assertion
    const collection = this.#db[collectionId]!;
    if (collection[documentData.id]) {
      throw new DatabaseAdapterErrors.DocumentAlreadyExistsError(collectionId, documentData.id);
    }

    collection[documentData.id] = documentData;
    await this.#saveToFile(options);
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (
    collectionId,
    documentId,
    options,
  ): Promise<void> => {
    if (!this.#db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
    }

    if (!(await this.hasDocument(collectionId, documentId, options))) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
    }

    // oxlint-disable-next-line no-non-null-assertion
    const collection = this.#db[collectionId]!;
    // oxlint-disable-next-line no-dynamic-delete
    delete collection[documentId];
    await this.#saveToFile(options);
  };

  updateDocument: DatabaseAdapter["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
    options,
  ): Promise<void> => {
    if (!this.#db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId);
    }

    const prevItem = await this.getDocument(collectionId, documentId, options);
    if (!prevItem) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
    }

    // oxlint-disable-next-line no-non-null-assertion
    const collection = this.#db[collectionId]!;
    collection[documentId] = { ...prevItem, ...documentData, id: documentId };
    await this.#saveToFile(options);
  };

  async #readFromFile(options: { abortSignal?: AbortSignal }): Promise<void> {
    try {
      const db = await fsp.readFile(this.#filename, {
        encoding: "utf8",
        signal: options.abortSignal,
      });
      this.#db = db ? JSON.parse(db) : {};
    } catch {
      this.#db = {};
    }
  }
  async #saveToFile(options: { abortSignal?: AbortSignal }): Promise<void> {
    if (!this.#db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    await fsp.writeFile(this.#filename, JSON.stringify(this.#db, null, 2), {
      encoding: "utf8",
      signal: options.abortSignal,
    });
  }
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
 * const storage = new LocalFileStorage("./store/");
 * ```
 */
export class LocalFileStorage implements StorageAdapter {
  #basePath: string;

  constructor(pathPrefix = ".") {
    this.#basePath = path.resolve(pathPrefix);
  }

  #genPath(...pathParts: (string | undefined)[]): string {
    return path.join(this.#basePath, ...pathParts.filter((part) => part !== undefined));
  }

  // Containers

  createContainer: StorageAdapter["createContainer"] = async (containerId, options) => {
    if (await this.hasContainer(containerId, options)) {
      throw new StorageAdapterErrors.ContainerAlreadyExistsError(containerId);
    }

    await fsp.mkdir(this.#genPath(containerId), { recursive: true });
  };

  deleteContainer: StorageAdapter["deleteContainer"] = async (containerId, options) => {
    if (!(await this.hasContainer(containerId, options))) {
      throw new StorageAdapterErrors.ContainerDoesNotExistError(containerId);
    }

    await fsp.rm(this.#genPath(containerId), { force: true, recursive: true });
  };

  hasContainer: StorageAdapter["hasContainer"] = async (containerId) => {
    return fs.existsSync(this.#genPath(containerId));
  };

  listContainers: StorageAdapter["listContainers"] = async () => {
    const dirPath = this.#genPath();
    if (!fs.existsSync(dirPath)) {
      throw new StorageAdapterErrors.StorageNotInitializedError(`Dir "${dirPath}" does not exist`);
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
  };

  // Files

  deleteFiles: StorageAdapter["deleteFiles"] = async (
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

  hasFile: StorageAdapter["hasFile"] = async (containerId, filepath) => {
    const path = this.#genPath(containerId, filepath);
    return fs.existsSync(path);
  };

  downloadFile: StorageAdapter["downloadFile"] = async (containerId, filepath, options) => {
    if (!(await this.hasFile(containerId, filepath, options))) {
      throw new StorageAdapterErrors.FileDoesNotExistError(containerId, filepath);
    }

    const path = this.#genPath(containerId, filepath);
    const buffer = await fsp.readFile(path);
    const content = new Blob([buffer as Buffer<ArrayBuffer>]);
    return { content, path };
  };

  uploadFiles: StorageAdapter["uploadFiles"] = async (containerId, files, options) => {
    for (const file of files) {
      const filepath = this.#genPath(containerId, file.path);
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
