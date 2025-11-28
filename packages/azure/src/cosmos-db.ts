import type { CosmosClient, Database } from "@azure/cosmos";
import type {
  DatabaseAdapter,
  DatabaseAdapterOptions,
  DatabaseDocumentListOptions,
  StoryBookerDatabaseDocument,
} from "@storybooker/core/adapter";

export class AzureCosmosDatabaseService implements DatabaseAdapter {
  #db: Database;

  constructor(client: CosmosClient, dbName = "StoryBooker") {
    this.#db = client.database(dbName);
  }

  init: DatabaseAdapter["init"] = async (options) => {
    await this.#db.client.databases.createIfNotExists(
      { id: this.#db.id },
      { abortSignal: options.abortSignal },
    );
  };

  listCollections: DatabaseAdapter["listCollections"] = async (options) => {
    const response = await this.#db.containers
      .readAll({ abortSignal: options.abortSignal })
      .fetchAll();
    const collections: string[] = response.resources.map(
      (resource) => resource.id,
    );

    return collections;
  };

  createCollection: DatabaseAdapter["createCollection"] = async (
    collectionId,
    options,
  ) => {
    await this.#db.containers.create(
      { id: collectionId },
      { abortSignal: options.abortSignal },
    );
    return;
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (
    collectionId,
    options,
  ) => {
    try {
      const response = await this.#db
        .container(collectionId)
        .read({ abortSignal: options.abortSignal });
      return !!response.resource;
    } catch {
      return false;
    }
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (
    collectionId,
    options,
  ) => {
    await this.#db
      .container(collectionId)
      .delete({ abortSignal: options.abortSignal });
    return;
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
    const item = this.#db.container(collectionId).item(documentId);
    const response = await item.read({ abortSignal: options.abortSignal });
    const document: Document = response.resource;
    document.id = documentId;
    return document;
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ) => {
    await this.#db
      .container(collectionId)
      .items.create(documentData, { abortSignal: options.abortSignal });
    return;
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (
    collectionId,
    documentId,
    options,
  ) => {
    const item = this.#db.container(collectionId).item(documentId);
    const response = await item.read({ abortSignal: options.abortSignal });
    return !!response.resource;
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (
    collectionId,
    documentId,
    options,
  ) => {
    await this.#db
      .container(collectionId)
      .item(documentId)
      .delete({ abortSignal: options.abortSignal });
    return;
  };

  // oxlint-disable-next-line max-params
  updateDocument: DatabaseAdapter["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
    options,
  ) => {
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

    return;
  };
}
