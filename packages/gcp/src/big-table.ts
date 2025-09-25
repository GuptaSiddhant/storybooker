import {
  Bigtable,
  type BigtableOptions,
  type Instance,
} from "@google-cloud/bigtable";
import { SERVICE_NAME } from "@storybooker/core/constants";
import type {
  DatabaseDocumentListOptions,
  DatabaseService,
  DatabaseServiceOptions,
  StoryBookerDatabaseDocument,
} from "@storybooker/core/types";

type ColumnFamily = "cf1";
const COLUMN_FAMILY: ColumnFamily = "cf1";

export class GcpBigtableDatabaseService implements DatabaseService {
  #instance: Instance;

  constructor(client: Bigtable, instanceId?: string);
  constructor(options: BigtableOptions, instanceId?: string);
  constructor(
    clientOrOptions: Bigtable | BigtableOptions,
    instanceId: string = SERVICE_NAME,
  ) {
    const client =
      clientOrOptions instanceof Bigtable
        ? clientOrOptions
        : new Bigtable(clientOrOptions);
    this.#instance = client.instance(instanceId);
  }

  init: DatabaseService["init"] = async (_options) => {
    // Bigtable instances are typically created outside of app code (via console/IaC)
    // Optionally, check if instance exists
    const [exists] = await this.#instance.exists();
    if (!exists) {
      throw new Error(
        `Bigtable instance '${this.#instance.id}' does not exist.`,
      );
    }
  };

  listCollections: DatabaseService["listCollections"] = async (_options) => {
    const [tables] = await this.#instance.getTables();
    return tables.map((table) => table.id);
  };

  createCollection: DatabaseService["createCollection"] = async (
    collectionId,
    _options,
  ) => {
    await this.#instance.createTable(collectionId, {
      families: [COLUMN_FAMILY],
    });
  };

  hasCollection: DatabaseService["hasCollection"] = async (
    collectionId,
    _options,
  ) => {
    const table = this.#instance.table(collectionId);
    const [exists] = await table.exists();
    return exists;
  };

  deleteCollection: DatabaseService["deleteCollection"] = async (
    collectionId,
    _options,
  ) => {
    const table = this.#instance.table(collectionId);
    await table.delete();
  };

  listDocuments: DatabaseService["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    _listOptions: DatabaseDocumentListOptions<Document>,
    _options: DatabaseServiceOptions,
  ) => {
    const table = this.#instance.table(collectionId);
    const [rows] = await table.getRows();
    const list: Document[] = [];
    for (const row of rows) {
      const data = (row.data as Record<ColumnFamily, Document>)[COLUMN_FAMILY];
      const document: Document = { ...data, id: row.id };
      list.push(document);
    }

    return list;
  };

  getDocument: DatabaseService["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    _options: DatabaseServiceOptions,
  ) => {
    const table = this.#instance.table(collectionId);
    const row = table.row(documentId);
    const [exists] = await row.exists();
    if (!exists) {
      throw new Error(`Document '${documentId}' not found.`);
    }

    const [rowData] = await row.get<Document>([COLUMN_FAMILY]);

    return { ...rowData, id: documentId };
  };

  createDocument: DatabaseService["createDocument"] = async (
    collectionId,
    documentData,
    _options,
  ) => {
    const table = this.#instance.table(collectionId);
    const row = table.row(documentData.id);
    await row.create({ entry: { [COLUMN_FAMILY]: documentData } });
  };

  hasDocument: DatabaseService["hasDocument"] = async (
    collectionId,
    documentId,
    _options,
  ) => {
    const table = this.#instance.table(collectionId);
    const row = table.row(documentId);
    const [exists] = await row.exists();
    return exists;
  };

  deleteDocument: DatabaseService["deleteDocument"] = async (
    collectionId,
    documentId,
    _options,
  ) => {
    const table = this.#instance.table(collectionId);
    const row = table.row(documentId);
    await row.delete();
  };

  updateDocument: DatabaseService["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
  ) => {
    const table = this.#instance.table(collectionId);
    const row = table.row(documentId);
    await row.save({ [COLUMN_FAMILY]: documentData });
  };
}
