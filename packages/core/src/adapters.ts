import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import type { Stream } from "node:stream";
import type {
  DatabaseDocumentListOptions,
  DatabaseService,
  DatabaseServiceOptions,
  StorageService,
  StoryBookerDatabaseDocument,
} from "./types";
import { writeWebStreamToFile } from "./utils/file-utils";

type Database = Record<string, Record<string, StoryBookerDatabaseDocument>>;

export class LocalFileDatabase implements DatabaseService {
  #filename: string;
  #db: Database = {};

  constructor(filename = "db.json") {
    this.#filename = filename;
  }

  init: DatabaseService["init"] = async (options) => {
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

  listCollections: DatabaseService["listCollections"] = async () => {
    return Object.keys(this.#db);
  };

  createCollection: DatabaseService["createCollection"] = async (
    collectionId,
    options,
  ): Promise<void> => {
    if (!this.#db[collectionId]) {
      this.#db[collectionId] = {};
    }
    await this.#saveToFile(options);
  };

  deleteCollection: DatabaseService["deleteCollection"] = async (
    collectionId,
    options,
  ): Promise<void> => {
    // oxlint-disable-next-line no-dynamic-delete
    delete this.#db[collectionId];
    await this.#saveToFile(options);
  };

  hasCollection: DatabaseService["hasCollection"] = async (
    collectionId,
    _options,
  ) => {
    return Object.hasOwn(this.#db, collectionId);
  };

  listDocuments: DatabaseService["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    listOptions: DatabaseDocumentListOptions<Document>,
    _options: DatabaseServiceOptions,
  ): Promise<Document[]> => {
    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new Error(`No collection - ${collectionId}`);
    }
    const {
      limit = Number.POSITIVE_INFINITY,
      sort,
      filter,
    } = listOptions || {};

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

  getDocument: DatabaseService["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    _options: DatabaseServiceOptions,
  ): Promise<Document> => {
    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new Error(`No collection - ${collectionId}`);
    }
    const item = this.#db[collectionId]?.[documentId];
    if (!item) {
      throw new Error(
        `Item '${documentId}' not found in collection '${collectionId}'`,
      );
    }
    return item as Document;
  };

  hasDocument: DatabaseService["hasDocument"] = async (
    collectionId,
    documentId,
    options,
  ) => {
    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new Error(`No collection - ${collectionId}`);
    }
    return !!(await this.getDocument(collectionId, documentId, options));
  };

  createDocument: DatabaseService["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ): Promise<void> => {
    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new Error(`No collection - ${collectionId}`);
    }
    // oxlint-disable-next-line no-non-null-assertion
    const collection = this.#db[collectionId]!;
    if (collection[documentData.id]) {
      throw new Error(
        `Item '${documentData.id}' already exists in collection '${collectionId}'`,
      );
    }
    collection[documentData.id] = documentData;
    await this.#saveToFile(options);
  };

  deleteDocument: DatabaseService["deleteDocument"] = async (
    collectionId,
    documentId,
    options,
  ): Promise<void> => {
    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new Error(`No collection - ${collectionId}`);
    }
    if (!(await this.hasDocument(collectionId, documentId, options))) {
      throw new Error(
        `Item '${documentId}' not found in collection '${collectionId}'`,
      );
    }
    // oxlint-disable-next-line no-non-null-assertion
    const collection = this.#db[collectionId]!;
    // oxlint-disable-next-line no-dynamic-delete
    delete collection[documentId];
    await this.#saveToFile(options);
  };

  updateDocument: DatabaseService["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
    options,
  ): Promise<void> => {
    if (!Object.hasOwn(this.#db, collectionId)) {
      throw new Error(`No collection - ${collectionId}`);
    }
    const prevItem = await this.getDocument(collectionId, documentId, options);
    if (!prevItem) {
      throw new Error(
        `Item '${documentId}' not found in collection '${collectionId}'`,
      );
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
    await fsp.writeFile(this.#filename, JSON.stringify(this.#db, null, 2), {
      encoding: "utf8",
      signal: options.abortSignal,
    });
  }
}

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
    const buffer = await fsp.readFile(path);
    const content = new Blob([buffer as Buffer<ArrayBuffer>]);
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
