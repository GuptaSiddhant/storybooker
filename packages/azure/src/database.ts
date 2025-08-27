import {
  TableClient,
  TableServiceClient,
  type TableEntityResult,
} from "@azure/data-tables";
import type {
  DatabaseService,
  DatabaseDocumentListOptions,
} from "@storybooker/router/types";

export class AzureTables implements DatabaseService {
  #connectionString: string;
  #serviceClient: TableServiceClient;

  constructor(connectionString: string) {
    this.#connectionString = connectionString;
    this.#serviceClient =
      TableServiceClient.fromConnectionString(connectionString);
  }

  listCollections: DatabaseService["listCollections"] = async () => {
    const collections: string[] = [];
    for await (const table of this.#serviceClient.listTables()) {
      if (table.name) {
        collections.push(table.name);
      }
    }

    return collections;
  };

  createCollection: DatabaseService["createCollection"] = async (name) => {
    await this.#serviceClient.createTable(name);
    return;
  };

  deleteCollection: DatabaseService["deleteCollection"] = async (name) => {
    await this.#serviceClient.deleteTable(name);
    return;
  };

  listDocuments = async <Item extends { id: string }>(
    tableName: string,
    options?: DatabaseDocumentListOptions<Item>,
  ): Promise<Item[]> => {
    const { filter, limit, select, sort } = options || {};
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      tableName,
    );
    const pageIterator = tableClient
      .listEntities({
        queryOptions: {
          filter: typeof filter === "string" ? filter : undefined,
          select,
        },
      })
      .byPage({ maxPageSize: limit });

    const items: Item[] = [];
    for await (const page of pageIterator) {
      for (const entity of page) {
        const item = this.#entityToItem<Item>(entity);
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

  getDocument = async <Item extends { id: string }>(
    tableName: string,
    id: string,
    partitionKey = id,
  ): Promise<Item> => {
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      tableName,
    );
    const entity = await tableClient.getEntity(partitionKey, id);

    return this.#entityToItem<Item>(entity);
  };

  createDocument = async <Item extends { id: string }>(
    tableName: string,
    item: Item,
  ): Promise<Item> => {
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      tableName,
    );
    await tableClient.createEntity({
      ...item,
      partitionKey: item.id,
      rowKey: item.id,
    });

    return item;
  };

  deleteDocument = async (
    tableName: string,
    id: string,
    partitionKey = id,
  ): Promise<void> => {
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      tableName,
    );
    await tableClient.deleteEntity(partitionKey, id);

    return;
  };

  // oxlint-disable-next-line max-params
  updateDocument = async <Item extends { id: string }>(
    tableName: string,
    id: string,
    item: Partial<Omit<Item, "id">>,
    partitionKey = id,
  ): Promise<void> => {
    const tableClient = TableClient.fromConnectionString(
      this.#connectionString,
      tableName,
    );
    await tableClient.updateEntity(
      { ...item, partitionKey, rowKey: id },
      "Merge",
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
