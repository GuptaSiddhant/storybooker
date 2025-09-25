import {
  odata,
  TableClient,
  TableServiceClient,
  type TableEntityResult,
} from "@azure/data-tables";
import type {
  DatabaseDocumentListOptions,
  DatabaseService,
  DatabaseServiceOptions,
  StoryBookerDatabaseDocument,
} from "@storybooker/core/types";

export class AzureDataTablesDatabaseService implements DatabaseService {
  #connectionString: string;
  #serviceClient: TableServiceClient;

  constructor(connectionString: string) {
    this.#connectionString = connectionString;
    this.#serviceClient =
      TableServiceClient.fromConnectionString(connectionString);
  }

  listCollections: DatabaseService["listCollections"] = async (options) => {
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

  createCollection: DatabaseService["createCollection"] = async (
    collectionId,
    options,
  ) => {
    const tableName = genTableNameFromCollectionId(collectionId);
    await this.#serviceClient.createTable(tableName, {
      abortSignal: options.abortSignal,
    });
    return;
  };

  hasCollection: DatabaseService["hasCollection"] = async (
    collectionId,
    options,
  ) => {
    try {
      const tableName = genTableNameFromCollectionId(collectionId);
      const iterator = this.#serviceClient.listTables({
        abortSignal: options.abortSignal,
        queryOptions: { filter: odata`TableName eq ${tableName}` },
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

  deleteCollection: DatabaseService["deleteCollection"] = async (
    collectionId,
    options,
  ) => {
    const tableName = genTableNameFromCollectionId(collectionId);
    await this.#serviceClient.deleteTable(tableName, {
      abortSignal: options.abortSignal,
    });
    return;
  };

  listDocuments: DatabaseService["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    listOptions: DatabaseDocumentListOptions<Document>,
    options: DatabaseServiceOptions,
  ): Promise<Document[]> => {
    const { filter, limit, select, sort } = listOptions || {};

    const tableName = genTableNameFromCollectionId(collectionId);
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      tableName,
    );
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

  getDocument: DatabaseService["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    options: DatabaseServiceOptions,
  ): Promise<Document> => {
    const tableName = genTableNameFromCollectionId(collectionId);
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      tableName,
    );
    const entity = await tableClient.getEntity(collectionId, documentId, {
      abortSignal: options.abortSignal,
    });

    return entityToItem<Document>(entity);
  };

  hasDocument: DatabaseService["hasDocument"] = async (
    collectionId,
    documentId,
    options,
  ) => {
    try {
      return Boolean(await this.getDocument(collectionId, documentId, options));
    } catch {
      return false;
    }
  };

  createDocument: DatabaseService["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ) => {
    const tableName = genTableNameFromCollectionId(collectionId);
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      tableName,
    );
    await tableClient.createEntity(
      {
        ...documentData,
        partitionKey: collectionId,
        rowKey: documentData.id,
      },
      { abortSignal: options.abortSignal },
    );

    return;
  };

  deleteDocument: DatabaseService["deleteDocument"] = async (
    collectionId,
    documentId,
    options,
  ) => {
    const tableName = genTableNameFromCollectionId(collectionId);
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      tableName,
    );
    await tableClient.deleteEntity(collectionId, documentId, {
      abortSignal: options.abortSignal,
    });

    return;
  };

  // oxlint-disable-next-line max-params
  updateDocument: DatabaseService["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
    options,
  ) => {
    const tableName = genTableNameFromCollectionId(collectionId);
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      tableName,
    );
    await tableClient.updateEntity(
      { ...documentData, partitionKey: collectionId, rowKey: documentId },
      "Merge",
      { abortSignal: options.abortSignal },
    );

    return;
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
    id: entity.rowKey || entity.partitionKey || entity.etag,
  } as unknown as Item;
}
