/**
 * Service to interact with database.
 *
 * The service should callbacks to CRUD operations
 * to an existing database.
 */
export interface DatabaseService {
  /**
   * An optional method that is called on app boot-up
   * to run async setup functions.
   * @param options Common options like abortSignal.
   * @throws if an error occur during initialisation.
   */
  init?: (options: DatabaseServiceOptions) => Promise<void>;

  // Collections (group of items. aka Tables)

  /**
   * List all collections available in the DB.
   * @param options Common options like abortSignal.
   * @returns A list of names/IDs of the collections.
   * @throws If the DB service is not connected.
   */
  listCollections: (options: DatabaseServiceOptions) => Promise<string[]>;

  /**
   * Create a collection used for different projects.
   * @param id ID of the collection
   * @param options Common options like abortSignal.
   * @throws if collection with ID already exists.
   */
  createCollection: (
    collectionId: string,
    options: DatabaseServiceOptions,
  ) => Promise<void>;

  /**
   * Delete an existing collection.
   * @param id ID of the collection
   * @param options Common options like abortSignal.
   * @throws if collection with ID does not exist.
   */
  deleteCollection: (
    collectionId: string,
    options: DatabaseServiceOptions,
  ) => Promise<void>;

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
    options: DatabaseServiceOptions,
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
    options: DatabaseServiceOptions,
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
    options: DatabaseServiceOptions,
  ) => Promise<Document>;

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
    options: DatabaseServiceOptions,
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
    options: DatabaseServiceOptions,
  ) => Promise<void>;
}

/**
 * Base Document shape used in StoryBooker Database.
 * Should always contain a filed 'id' with string value.
 */
export interface StoryBookerDatabaseDocument {
  id: string;
}

/** Common Database service options.  */
export interface DatabaseServiceOptions {
  /** A signal that can be used to cancel the request handling. */
  abortSignal?: AbortSignal;
}

export interface DatabaseDocumentListOptions<Item extends { id: string }> {
  limit?: number;
  filter?: string | ((item: Item) => boolean);
  select?: string[];
  sort?: "latest" | ((item1: Item, item2: Item) => number);
}
