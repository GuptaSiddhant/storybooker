import { CosmosClient, type Database } from "@azure/cosmos";
import {
  SERVICE_NAME,
  type DatabaseDocumentListOptions,
  type DatabaseService,
} from "@storybooker/core";

export class AzureCosmosDatabaseService implements DatabaseService {
  #db: Database;

  constructor(connectionString: string, dbName = SERVICE_NAME) {
    this.#db = new CosmosClient(connectionString).database(dbName);
  }

  async init(): Promise<void> {
    await this.#db.client.databases.createIfNotExists({ id: this.#db.id });
  }

  listCollections: DatabaseService["listCollections"] = async () => {
    const response = await this.#db.containers.readAll().fetchAll();
    const collections: string[] = response.resources.map(
      (resource) => resource.id,
    );

    return collections;
  };

  createCollection: DatabaseService["createCollection"] = async (name) => {
    await this.#db.containers.create({ id: name });
    return;
  };

  deleteCollection: DatabaseService["deleteCollection"] = async (name) => {
    await this.#db.container(name).delete();
    return;
  };

  listDocuments = async <Item extends { id: string }>(
    name: string,
    _options?: DatabaseDocumentListOptions<Item>,
  ): Promise<Item[]> => {
    const items = await this.#db.container(name).items.readAll().fetchAll();
    return items.resources as Item[];
  };

  getDocument = async <Item extends { id: string }>(
    name: string,
    id: string,
    partitionKey = id,
  ): Promise<Item> => {
    const item = this.#db.container(name).item(id, partitionKey);
    const response = await item.read();
    return { ...response.resource, id } as Item;
  };

  createDocument = async <Item extends { id: string }>(
    name: string,
    item: Item,
  ): Promise<void> => {
    await this.#db.container(name).items.create(item);
    return;
  };

  deleteDocument = async (
    name: string,
    id: string,
    partitionKey = id,
  ): Promise<void> => {
    await this.#db.container(name).item(id, partitionKey).delete();
    return;
  };

  // oxlint-disable-next-line max-params
  updateDocument = async <Item extends { id: string }>(
    name: string,
    id: string,
    item: Partial<Omit<Item, "id">>,
    partitionKey = id,
  ): Promise<void> => {
    await this.#db
      .container(name)
      .item(id, partitionKey)
      .patch<Item>({
        operations: Object.entries(item).map(([key, value]) => ({
          op: "replace",
          path: `/${key}`,
          value,
        })),
      });

    return;
  };
}
