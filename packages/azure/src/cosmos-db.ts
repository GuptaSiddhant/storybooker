import type { CosmosClient, Database } from "@azure/cosmos";
import { SERVICE_NAME } from "@storybooker/core/constants";
import type {
  DatabaseDocumentListOptions,
  DatabaseService,
  DatabaseServiceOptions,
  StoryBookerDatabaseDocument,
} from "@storybooker/core/types";

export class AzureCosmosDatabaseService implements DatabaseService {
  #db: Database;

  constructor(client: CosmosClient, dbName = SERVICE_NAME) {
    this.#db = client.database(dbName);
  }

  init: DatabaseService["init"] = async (options) => {
    await this.#db.client.databases.createIfNotExists(
      { id: this.#db.id },
      { abortSignal: options.abortSignal },
    );
  };

  listCollections: DatabaseService["listCollections"] = async (options) => {
    const response = await this.#db.containers
      .readAll({ abortSignal: options.abortSignal })
      .fetchAll();
    const collections: string[] = response.resources.map(
      (resource) => resource.id,
    );

    return collections;
  };

  createCollection: DatabaseService["createCollection"] = async (
    collectionId,
    options,
  ) => {
    await this.#db.containers.create(
      { id: collectionId },
      { abortSignal: options.abortSignal },
    );
    return;
  };

  hasCollection: DatabaseService["hasCollection"] = async (
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

  deleteCollection: DatabaseService["deleteCollection"] = async (
    collectionId,
    options,
  ) => {
    await this.#db
      .container(collectionId)
      .delete({ abortSignal: options.abortSignal });
    return;
  };

  listDocuments: DatabaseService["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    _listOptions: DatabaseDocumentListOptions<Document>,
    options: DatabaseServiceOptions,
  ) => {
    const items = await this.#db
      .container(collectionId)
      .items.readAll({ abortSignal: options.abortSignal })
      .fetchAll();
    return items.resources as Document[];
  };

  getDocument: DatabaseService["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    options: DatabaseServiceOptions,
  ) => {
    const item = this.#db.container(collectionId).item(documentId);
    const response = await item.read({ abortSignal: options.abortSignal });
    const document: Document = response.resource;
    document.id = documentId;
    return document;
  };

  createDocument: DatabaseService["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ) => {
    await this.#db
      .container(collectionId)
      .items.create(documentData, { abortSignal: options.abortSignal });
    return;
  };

  hasDocument: DatabaseService["hasDocument"] = async (
    collectionId,
    documentId,
    options,
  ) => {
    const item = this.#db.container(collectionId).item(documentId);
    const response = await item.read({ abortSignal: options.abortSignal });
    return !!response.resource;
  };

  deleteDocument: DatabaseService["deleteDocument"] = async (
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
  updateDocument: DatabaseService["updateDocument"] = async (
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
