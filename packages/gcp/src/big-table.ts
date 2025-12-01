import type { Bigtable, Instance } from "@google-cloud/bigtable";
import {
  DatabaseAdapterErrors,
  type DatabaseAdapter,
  type DatabaseAdapterOptions,
  type DatabaseDocumentListOptions,
  type StoryBookerDatabaseDocument,
} from "@storybooker/core/adapter";

type ColumnFamily = "cf1";
const COLUMN_FAMILY: ColumnFamily = "cf1";

export class GcpBigtableDatabaseAdapter implements DatabaseAdapter {
  #instance: Instance;

  constructor(client: Bigtable, instanceName = "StoryBooker") {
    this.#instance = client.instance(instanceName);
  }

  init: DatabaseAdapter["init"] = async (_options) => {
    // Bigtable instances are typically created outside of app code (via console/IaC)
    // Optionally, check if instance exists
    const [exists] = await this.#instance.exists();
    if (!exists) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError(
        `Bigtable instance '${this.#instance.id}' does not exist.`,
      );
    }
  };

  listCollections: DatabaseAdapter["listCollections"] = async (_options) => {
    const [tables] = await this.#instance.getTables();
    return tables.map((table) => table.id);
  };

  createCollection: DatabaseAdapter["createCollection"] = async (
    collectionId,
    _options,
  ) => {
    try {
      await this.#instance.createTable(collectionId, {
        families: [COLUMN_FAMILY],
      });
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionAlreadyExistsError(
        collectionId,
        error,
      );
    }
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (
    collectionId,
    _options,
  ) => {
    const table = this.#instance.table(collectionId);
    const [exists] = await table.exists();
    return exists;
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (
    collectionId,
    _options,
  ) => {
    try {
      const table = this.#instance.table(collectionId);
      await table.delete();
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(
        collectionId,
        error,
      );
    }
  };

  listDocuments: DatabaseAdapter["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    _listOptions: DatabaseDocumentListOptions<Document>,
    _options: DatabaseAdapterOptions,
  ) => {
    try {
      const table = this.#instance.table(collectionId);
      const [rows] = await table.getRows();
      const list: Document[] = [];
      for (const row of rows) {
        const data = (row.data as Record<ColumnFamily, Document>)[
          COLUMN_FAMILY
        ];
        const document: Document = { ...data, id: row.id };
        list.push(document);
      }

      return list;
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(
        collectionId,
        error,
      );
    }
  };

  getDocument: DatabaseAdapter["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    _options: DatabaseAdapterOptions,
  ) => {
    const table = this.#instance.table(collectionId);
    const row = table.row(documentId);
    const [exists] = await row.exists();
    if (!exists) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(
        collectionId,
        documentId,
      );
    }

    const [rowData] = await row.get<Document>([COLUMN_FAMILY]);

    return { ...rowData, id: documentId };
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    _options,
  ) => {
    try {
      const table = this.#instance.table(collectionId);
      const row = table.row(documentData.id);
      await row.create({ entry: { [COLUMN_FAMILY]: documentData } });
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentAlreadyExistsError(
        collectionId,
        documentData.id,
        error,
      );
    }
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (
    collectionId,
    documentId,
    _options,
  ) => {
    const table = this.#instance.table(collectionId);
    const row = table.row(documentId);
    const [exists] = await row.exists();
    return exists;
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (
    collectionId,
    documentId,
    _options,
  ) => {
    try {
      const table = this.#instance.table(collectionId);
      const row = table.row(documentId);
      await row.delete();
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(
        collectionId,
        documentId,
        error,
      );
    }
  };

  updateDocument: DatabaseAdapter["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
  ) => {
    try {
      const table = this.#instance.table(collectionId);
      const row = table.row(documentId);
      await row.save({ [COLUMN_FAMILY]: documentData });
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(
        collectionId,
        documentId,
        error,
      );
    }
  };
}
