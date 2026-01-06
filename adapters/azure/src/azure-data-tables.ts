import type { TableClient, TableEntityResult, TableServiceClient } from "@azure/data-tables";
import {
  DatabaseAdapterErrors,
  type DatabaseAdapter,
  type DatabaseAdapterOptions,
  type DatabaseDocumentListOptions,
  type StoryBookerDatabaseDocument,
} from "storybooker/adapter/database";

/**
 * Factory function type for creating Azure Table clients.
 */
export type TableClientGenerator = (tableName: string) => TableClient;

/**
 * Azure Data Tables implementation of the DatabaseAdapter interface.
 *
 * @classdesc
 * Provides database operations for StoryBooker using Azure Data Tables as the backend.
 * Supports NoSQL tables and entities with automatic error handling.
 *
 * @example
 * ```ts
 * import { TableServiceClient, AzureNamedKeyCredential } from "@azure/data-tables";
 * import { AzureDataTablesDatabaseService } from "storybooker/azure-data-tables";
 *
 * // Create Azure Tables client
 * const credential = new AzureNamedKeyCredential(accountName, accountKey);
 * const serviceClient = new TableServiceClient(endpoint, credential);
 * const tableClientGenerator = (tableName) => serviceClient.getTableClient(tableName);
 * // Initialize the database adapter
 * const database = new AzureDataTablesDatabaseService(serviceClient, tableClientGenerator);
 * // Use the database adapter with StoryBooker
 * const router = createHonoRouter({ database });
 * ```
 *
 * @see {@link https://docs.microsoft.com/azure/storage/tables/ | Azure Data Tables Documentation}
 */
export class AzureDataTablesDatabaseService implements DatabaseAdapter {
  #serviceClient: TableServiceClient;
  #tableClientGenerator: TableClientGenerator;

  /**
   * Creates a new Azure Data Tables database adapter instance.
   *
   * @param serviceClient - The authenticated TableServiceClient instance for connecting to Azure Data Tables
   * @param tableClientGenerator - A factory function to generate TableClient instances for specific tables
   *
   * @example
   * ```ts
   * const serviceClient = new TableServiceClient(endpoint, credential);
   * const tableClientGenerator = (tableName) => serviceClient.getTableClient(tableName);
   * const database = new AzureDataTablesDatabaseService(serviceClient, tableClientGenerator);
   * ```
   */
  constructor(serviceClient: TableServiceClient, tableClientGenerator: TableClientGenerator) {
    this.#serviceClient = serviceClient;
    this.#tableClientGenerator = tableClientGenerator;
  }

  get metadata(): DatabaseAdapter["metadata"] {
    return {
      name: "Azure Tables",
      description: "NoSQL database using Azure Data Tables.",
      url: this.#serviceClient.url,
    };
  }

  listCollections: DatabaseAdapter["listCollections"] = async (options) => {
    const collections: string[] = [];
    for await (const table of this.#serviceClient.listTables({
      abortSignal: options.abortSignal,
    })) {
      if (table.name) {
        collections.push(table.name);
      }
    }

    return collections;
  };

  createCollection: DatabaseAdapter["createCollection"] = async (collectionId, options) => {
    try {
      const tableName = genTableNameFromCollectionId(collectionId);
      await this.#serviceClient.createTable(tableName, {
        abortSignal: options.abortSignal,
      });
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionAlreadyExistsError(collectionId, error);
    }
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (collectionId, options) => {
    try {
      const tableName = genTableNameFromCollectionId(collectionId);
      const iterator = this.#serviceClient.listTables({
        abortSignal: options.abortSignal,
        queryOptions: { filter: `TableName eq '${tableName}'` },
      });
      for await (const table of iterator) {
        if (table.name === collectionId) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (collectionId, options) => {
    try {
      const tableName = genTableNameFromCollectionId(collectionId);
      await this.#serviceClient.deleteTable(tableName, {
        abortSignal: options.abortSignal,
      });
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId, error);
    }
  };

  listDocuments: DatabaseAdapter["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    listOptions: DatabaseDocumentListOptions<Document>,
    options: DatabaseAdapterOptions,
  ): Promise<Document[]> => {
    const { filter, limit, select, sort } = listOptions ?? {};

    const tableName = genTableNameFromCollectionId(collectionId);
    const tableClient = this.#tableClientGenerator(tableName);

    const pageIterator = tableClient
      .listEntities({
        abortSignal: options.abortSignal,
        queryOptions: {
          filter: typeof filter === "string" ? filter : undefined,
          select,
        },
      })
      .byPage({ maxPageSize: limit });

    const items: Document[] = [];
    for await (const page of pageIterator) {
      for (const entity of page) {
        const item = entityToItem<Document>(entity);
        if (filter && typeof filter === "function") {
          if (filter(item)) {
            items.push(item);
          } else {
            continue;
          }
        } else {
          items.push(item);
        }
      }
    }

    if (sort && typeof sort === "function") {
      items.sort(sort);
    }

    return items;
  };

  getDocument: DatabaseAdapter["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    options: DatabaseAdapterOptions,
  ): Promise<Document> => {
    try {
      const tableName = genTableNameFromCollectionId(collectionId);
      const tableClient = this.#tableClientGenerator(tableName);
      const entity = await tableClient.getEntity(collectionId, documentId, {
        abortSignal: options.abortSignal,
      });

      return entityToItem<Document>(entity);
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (collectionId, documentId, options) => {
    try {
      return Boolean(await this.getDocument(collectionId, documentId, options));
    } catch {
      return false;
    }
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ) => {
    try {
      const tableName = genTableNameFromCollectionId(collectionId);
      const tableClient = this.#tableClientGenerator(tableName);
      await tableClient.createEntity(
        {
          ...documentData,
          partitionKey: collectionId,
          rowKey: documentData.id,
        },
        { abortSignal: options.abortSignal },
      );
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentAlreadyExistsError(
        collectionId,
        documentData.id,
        error,
      );
    }
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (collectionId, documentId, options) => {
    try {
      const tableName = genTableNameFromCollectionId(collectionId);
      const tableClient = this.#tableClientGenerator(tableName);
      await tableClient.deleteEntity(collectionId, documentId, {
        abortSignal: options.abortSignal,
      });
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
      const tableName = genTableNameFromCollectionId(collectionId);
      const tableClient = this.#tableClientGenerator(tableName);
      await tableClient.updateEntity(
        { ...documentData, partitionKey: collectionId, rowKey: documentId },
        "Merge",
        { abortSignal: options.abortSignal },
      );
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };
}

function genTableNameFromCollectionId(collectionId: string): string {
  if (/^[A-Za-z][A-Za-z0-9]{2,62}$/.test(collectionId)) {
    return collectionId;
  }

  return collectionId.replaceAll(/\W/g, "").slice(0, 63).padEnd(3, "X");
}

function entityToItem<Item extends { id: string }>(
  entity: TableEntityResult<Record<string, unknown>>,
): Item {
  return {
    ...entity,
    id: entity.rowKey ?? entity.partitionKey ?? entity.etag,
  } as unknown as Item;
}
