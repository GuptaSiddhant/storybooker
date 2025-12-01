// oxlint-disable max-classes-per-file
// oxlint-disable max-params
// oxlint-disable require-await
// oxlint-disable no-unsafe-assignment

import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { LoggerAdapter } from "./logger";

/**
 * Service adapter to interact with database.
 *
 * @description
 * The adapter should provide callbacks to CRUD operations
 * to an existing database.
 *
 * - `collection`: A collection/container/table to hold items.
 * - `document`: A single entry in collection which contains key-value pairs (no nested data).
 *    Each document has a key 'id` which is unique in the collection.
 *
 * @throws {DatabaseNotInitializedError} if the DB service is not connected.
 * @throws {CollectionAlreadyExistsError} if the collection already exists.
 * @throws {CollectionDoesNotExistError} if the collection does not exist.
 * @throws {DocumentAlreadyExistsError} if the document already exists in the collection.
 * @throws {DocumentDoesNotExistError} if the document does not exist in the collection.
 */
export interface DatabaseAdapter {
  /**
   * An optional method that is called on app boot-up
   * to run async setup functions.
   * @param options Common options like abortSignal.
   * @throws if an error occur during initialisation.
   */
  init?: (options: DatabaseAdapterOptions) => Promise<void>;

  // Collections (group of items. aka Tables)

  /**
   * List all collections available in the DB.
   * @param options Common options like abortSignal.
   * @returns A list of names/IDs of the collections.
   * @throws {DatabaseNotInitializedError} if the DB service is not connected.
   */
  listCollections: (options: DatabaseAdapterOptions) => Promise<string[]>;

  /**
   * Create a collection used for different projects.
   * @param collectionId ID of the collection
   * @param options Common options like abortSignal.
   * @throws {DatabaseNotInitializedError} if the DB service is not connected.
   * @throws {CollectionAlreadyExistsError} if collection with ID already exists.
   */
  createCollection: (
    collectionId: string,
    options: DatabaseAdapterOptions,
  ) => Promise<void>;

  /**
   * Delete an existing collection.
   * @param collectionId ID of the collection
   * @param options Common options like abortSignal.
   * @throws {DatabaseNotInitializedError} if the DB service is not connected.
   * @throws {CollectionDoesNotExistError} if collection with ID does not exist.
   */
  deleteCollection: (
    collectionId: string,
    options: DatabaseAdapterOptions,
  ) => Promise<void>;

  /**
   * Check if collection exists.
   * @param collectionId ID of the collection
   * @param options Common options like abortSignal.
   * @returns if collection is available of not
   * @throws never.
   */
  hasCollection: (
    collectionId: string,
    options: DatabaseAdapterOptions,
  ) => Promise<boolean>;

  // Documents (items, entries, rows, etc)

  /**
   * List all documents available in the requested collection.
   * @param collectionId ID of the collection
   * @param listOptions Options to format/sort the result
   * @param options Common options like abortSignal.
   * @returns List of documents
   * @throws if the collection does not exist.
   */
  listDocuments: <Document extends StoryBookerDatabaseDocument>(
    collectionId: string,
    listOptions: DatabaseDocumentListOptions<Document>,
    options: DatabaseAdapterOptions,
  ) => Promise<Document[]>;

  /**
   * Create a new document in the collection.
   * @param collectionId ID of the collection
   * @param documentData Data to be stored
   * @param options Common options like abortSignal.
   * @throws if the collection does not exist.
   */
  createDocument: <Document extends StoryBookerDatabaseDocument>(
    collectionId: string,
    documentData: Document,
    options: DatabaseAdapterOptions,
  ) => Promise<void>;

  /**
   * Get matching document data available in the requested collection.
   * @param collectionId ID of the collection
   * @param documentId ID of the document
   * @param options Common options like abortSignal.
   * @returns Data of the document
   * @throws if the collection or document does not exist.
   */
  getDocument: <Document extends StoryBookerDatabaseDocument>(
    collectionId: string,
    documentId: string,
    options: DatabaseAdapterOptions,
  ) => Promise<Document>;

  /**
   * Check matching document data available in the requested collection.
   * @param collectionId ID of the collection
   * @param documentId ID of the document
   * @param options Common options like abortSignal.
   * @returns if document is available of not
   * @throws if the collection does not exists.
   */
  hasDocument: (
    collectionId: string,
    documentId: string,
    options: DatabaseAdapterOptions,
  ) => Promise<boolean>;

  /**
   * Update matching document data available in the requested collection.
   * @param collectionId ID of the collection
   * @param documentId ID of the document
   * @param documentData Partial data to be updated.
   * @param options Common options like abortSignal.
   * @throws if the collection or document does not exist.
   */
  updateDocument: <Document extends StoryBookerDatabaseDocument>(
    collectionId: string,
    documentId: string,
    documentData: Partial<Omit<Document, "id">>,
    options: DatabaseAdapterOptions,
  ) => Promise<void>;

  /**
   * Delete matching document available in the requested collection.
   * @param collectionId ID of the collection
   * @param documentId ID of the document
   * @param options Common options like abortSignal.
   * @throws if the collection or document does not exist.
   */
  deleteDocument: (
    collectionId: string,
    documentId: string,
    options: DatabaseAdapterOptions,
  ) => Promise<void>;
}

/**
 * Base Document shape used in StoryBooker Database.
 * Should always contain a filed 'id' with string value.
 */
export interface StoryBookerDatabaseDocument {
  id: string;
}

/** Common Database adapter options.  */
export interface DatabaseAdapterOptions {
  /** A signal that can be used to cancel the request handling. */
  abortSignal?: AbortSignal;
  /** Logger */
  logger: LoggerAdapter;
}

export interface DatabaseDocumentListOptions<Item extends { id: string }> {
  limit?: number;
  filter?: string | ((item: Item) => boolean);
  select?: string[];
  sort?: "latest" | ((item1: Item, item2: Item) => number);
}

/**
 * Pre-defined Database adapter errors
 * that can be used across different adapters.
 *
 * Throws {HTTPException} with relevant status codes.
 */
export const DatabaseAdapterErrors = {
  DatabaseNotInitializedError: class extends HTTPException {
    constructor(cause?: unknown) {
      super(500, { cause, message: "Database adapter is not initialized." });
    }
  },
  CollectionAlreadyExistsError: class extends HTTPException {
    constructor(collectionId: string, cause?: unknown) {
      super(409, {
        cause,
        message: `Database collection '${collectionId}' already exists.`,
      });
    }
  },
  CollectionDoesNotExistError: class extends HTTPException {
    constructor(collectionId: string, cause?: unknown) {
      super(404, {
        cause,
        message: `Database collection '${collectionId}' does not exist.`,
      });
    }
  },
  DocumentAlreadyExistsError: class extends HTTPException {
    constructor(collectionId: string, documentId: string, cause?: unknown) {
      super(409, {
        cause,
        message: `Database document '${documentId}' already exists in collection '${collectionId}'.`,
      });
    }
  },
  DocumentDoesNotExistError: class extends HTTPException {
    constructor(collectionId: string, documentId: string, cause?: unknown) {
      super(404, {
        cause,
        message: `Database document '${documentId}' does not exist in collection '${collectionId}'.`,
      });
    }
  },
  CustomError: class extends HTTPException {
    constructor(status: number | undefined, message: string, cause?: unknown) {
      super(status as ContentfulStatusCode, { cause, message });
    }
  },
  // oxlint-disable-next-line no-explicit-any
} satisfies Record<string, new (...args: any[]) => HTTPException>;

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
      throw new DatabaseAdapterErrors.CollectionAlreadyExistsError(
        collectionId,
      );
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

  hasCollection: DatabaseAdapter["hasCollection"] = async (
    collectionId,
    _options,
  ) => {
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
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(
        collectionId,
        documentId,
      );
    }

    return item as Document;
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (
    collectionId,
    documentId,
    options,
  ) => {
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
      throw new DatabaseAdapterErrors.DocumentAlreadyExistsError(
        collectionId,
        documentData.id,
      );
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
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(
        collectionId,
        documentId,
      );
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
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(
        collectionId,
        documentId,
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
    if (!this.#db) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError();
    }

    await fsp.writeFile(this.#filename, JSON.stringify(this.#db, null, 2), {
      encoding: "utf8",
      signal: options.abortSignal,
    });
  }
}
