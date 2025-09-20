// oxlint-disable max-params

import { existsSync } from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import type {
  DatabaseDocumentListOptions,
  DatabaseService,
  DatabaseServiceOptions,
  StoryBookerDatabaseDocument,
} from "@storybooker/core/types";

type Database = Record<string, Record<string, StoryBookerDatabaseDocument>>;

export class LocalFileDatabase implements DatabaseService {
  #filename: string;
  #db: Database = {};

  constructor(filename = "db.json") {
    this.#filename = filename;
  }

  init: DatabaseService["init"] = async (options) => {
    if (existsSync(this.#filename)) {
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
      return items.filter(filter).slice(0, limit);
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
    if (!(await this.getDocument(collectionId, documentId, options))) {
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
