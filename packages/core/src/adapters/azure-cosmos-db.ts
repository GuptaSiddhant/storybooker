import type { CosmosClient, Database } from "@azure/cosmos";
import {
  DatabaseAdapterErrors,
  type DatabaseAdapter,
  type DatabaseAdapterOptions,
  type DatabaseDocumentListOptions,
  type StoryBookerDatabaseDocument,
} from "./_internal/database.ts";

/**
 * Azure Cosmos DB implementation of the DatabaseAdapter interface.
 *
 * @classdesc
 * Provides database operations for StoryBooker using Azure Cosmos DB as the backend.
 * Supports NoSQL collections and documents with automatic error handling.
 *
 * @example
 * ```ts
 * import { CosmosClient } from "@azure/cosmos";
 * import { AzureCosmosDatabaseService } from "storybooker/azure-cosmos-db";
 *
 * // Create Cosmos DB client
 * const client = new CosmosClient();
 * // Initialize the database adapter
 * const database = new AzureCosmosDatabaseService(client);
 * // Use the database adapter with StoryBooker
 * const router = createHonoRouter({ database });
 * ```
 *
 * @see {@link https://docs.microsoft.com/azure/cosmos-db/ | Azure Cosmos DB Documentation}
 */
export class AzureCosmosDatabaseService implements DatabaseAdapter {
  #db: Database;

  /**
   * Creates a new Azure Cosmos DB database adapter instance.
   *
   * @param client - The authenticated CosmosClient instance for connecting to Azure Cosmos DB
   * @param dbName - The name of the database to use (defaults to "StoryBooker")
   *
   * @example
   * ```ts
   * import { CosmosClient } from "@azure/cosmos";
   * const client = new CosmosClient({ endpoint, key });
   * const database = new AzureCosmosDatabaseService(client, "MyDatabase");
   * ```
   */
  constructor(client: CosmosClient, dbName = "StoryBooker") {
    this.#db = client.database(dbName);
  }

  get metadata(): DatabaseAdapter["metadata"] {
    return {
      name: "Azure Cosmos DB",
      description: "NoSQL database using Azure Cosmos DB containers and documents.",
      id: this.#db.id,
      url: this.#db.url,
    };
  }

  init: DatabaseAdapter["init"] = async (options) => {
    await this.#db.client.databases.createIfNotExists(
      { id: this.#db.id },
      { abortSignal: options.abortSignal },
    );
  };

  listCollections: DatabaseAdapter["listCollections"] = async (options) => {
    try {
      const response = await this.#db.containers
        .readAll({ abortSignal: options.abortSignal })
        .fetchAll();
      const collections: string[] = response.resources.map((resource) => resource.id);

      return collections;
    } catch (error) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError(error);
    }
  };

  createCollection: DatabaseAdapter["createCollection"] = async (collectionId, options) => {
    try {
      await this.#db.containers.create({ id: collectionId }, { abortSignal: options.abortSignal });
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionAlreadyExistsError(collectionId, error);
    }
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (collectionId, options) => {
    try {
      const response = await this.#db
        .container(collectionId)
        .read({ abortSignal: options.abortSignal });
      return Boolean(response.resource);
    } catch {
      return false;
    }
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (collectionId, options) => {
    try {
      await this.#db.container(collectionId).delete({ abortSignal: options.abortSignal });
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId, error);
    }
  };

  listDocuments: DatabaseAdapter["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    _listOptions: DatabaseDocumentListOptions<Document>,
    options: DatabaseAdapterOptions,
  ) => {
    const items = await this.#db
      .container(collectionId)
      .items.readAll({ abortSignal: options.abortSignal })
      .fetchAll();
    return items.resources as Document[];
  };

  getDocument: DatabaseAdapter["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    options: DatabaseAdapterOptions,
  ) => {
    try {
      const item = this.#db.container(collectionId).item(documentId);
      const response = await item.read({ abortSignal: options.abortSignal });
      const document = response.resource as Document;
      document.id = documentId;
      return document;
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ) => {
    try {
      await this.#db
        .container(collectionId)
        .items.create(documentData, { abortSignal: options.abortSignal });
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentAlreadyExistsError(
        collectionId,
        documentData.id,
        error,
      );
    }
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (collectionId, documentId, options) => {
    const item = this.#db.container(collectionId).item(documentId);
    const response = await item.read({ abortSignal: options.abortSignal });
    return Boolean(response.resource);
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (collectionId, documentId, options) => {
    try {
      await this.#db
        .container(collectionId)
        .item(documentId)
        .delete({ abortSignal: options.abortSignal });
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };

  // oxlint-disable-next-line max-params
  updateDocument: DatabaseAdapter["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
    options,
  ) => {
    try {
      await this.#db
        .container(collectionId)
        .item(documentId)
        .patch<Document>(
          {
            operations: Object.entries(documentData).map(([key, value]) => ({
              op: "replace",
              path: `/${key}`,
              value,
            })),
          },
          { abortSignal: options.abortSignal },
        );
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };
}
