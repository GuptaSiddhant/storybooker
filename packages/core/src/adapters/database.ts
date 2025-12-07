// oxlint-disable max-classes-per-file

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
export interface DatabaseAdapter<
  DbDocument extends StoryBookerDatabaseDocument = StoryBookerDatabaseDocument,
> {
  /**
   * Metadata about the adapter.
   */
  metadata: { name: string };

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
  createCollection: (collectionId: string, options: DatabaseAdapterOptions) => Promise<void>;

  /**
   * Delete an existing collection.
   * @param collectionId ID of the collection
   * @param options Common options like abortSignal.
   * @throws {DatabaseNotInitializedError} if the DB service is not connected.
   * @throws {CollectionDoesNotExistError} if collection with ID does not exist.
   */
  deleteCollection: (collectionId: string, options: DatabaseAdapterOptions) => Promise<void>;

  /**
   * Check if collection exists.
   * @param collectionId ID of the collection
   * @param options Common options like abortSignal.
   * @returns if collection is available of not
   * @throws never.
   */
  hasCollection: (collectionId: string, options: DatabaseAdapterOptions) => Promise<boolean>;

  // Documents (items, entries, rows, etc)

  /**
   * List all documents available in the requested collection.
   * @param collectionId ID of the collection
   * @param listOptions Options to format/sort the result
   * @param options Common options like abortSignal.
   * @returns List of documents
   * @throws if the collection does not exist.
   */
  listDocuments: (
    collectionId: string,
    listOptions: DatabaseDocumentListOptions<DbDocument>,
    options: DatabaseAdapterOptions,
  ) => Promise<DbDocument[]>;

  /**
   * Create a new document in the collection.
   * @param collectionId ID of the collection
   * @param documentData Data to be stored
   * @param options Common options like abortSignal.
   * @throws if the collection does not exist.
   */
  createDocument: (
    collectionId: string,
    documentData: DbDocument,
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
  getDocument: (
    collectionId: string,
    documentId: string,
    options: DatabaseAdapterOptions,
  ) => Promise<DbDocument>;

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
  updateDocument: (
    collectionId: string,
    documentId: string,
    documentData: Partial<Omit<DbDocument, "id">>,
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
  updatedAt: string;
  createdAt: string;
  [key: string]: unknown;
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
