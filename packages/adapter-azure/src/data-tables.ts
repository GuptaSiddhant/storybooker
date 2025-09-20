import {
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
    await this.#serviceClient.createTable(collectionId, {
      abortSignal: options.abortSignal,
    });
    return;
  };

  deleteCollection: DatabaseService["deleteCollection"] = async (
    collectionId,
    options,
  ) => {
    await this.#serviceClient.deleteTable(collectionId, {
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
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      collectionId,
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
        const item = this.#entityToItem<Document>(entity);
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
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      collectionId,
    );
    const entity = await tableClient.getEntity(collectionId, documentId, {
      abortSignal: options.abortSignal,
    });

    return this.#entityToItem<Document>(entity);
  };

  createDocument: DatabaseService["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ): Promise<void> => {
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      collectionId,
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
  ): Promise<void> => {
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      collectionId,
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
  ): Promise<void> => {
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      collectionId,
    );
    await tableClient.updateEntity(
      { ...documentData, partitionKey: collectionId, rowKey: documentId },
      "Merge",
      { abortSignal: options.abortSignal },
    );

    return;
  };

  #entityToItem = <Item extends { id: string }>(
    entity: TableEntityResult<Record<string, unknown>>,
  ): Item => {
    return {
      ...entity,
      id: entity.rowKey || entity.partitionKey || entity.etag,
    } as unknown as Item;
  };
}
