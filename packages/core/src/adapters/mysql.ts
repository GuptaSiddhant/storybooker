// oxlint-disable max-lines-per-function
// oxlint-disable no-unsafe-member-access

import {
  DatabaseAdapterErrors,
  type DatabaseAdapter,
  type DatabaseAdapterOptions,
  type DatabaseDocumentListOptions,
  type StoryBookerDatabaseDocument,
} from "./_internal/database.ts";

/**
 * Generic SQL connection interface compatible with multiple MySQL libraries.
 *
 * This interface works with mysql2, mysql, and other MySQL libraries
 * that implement execute() and query() methods.
 */
export interface MySQLConnection {
  connect?(): Promise<void>;
  execute<Data>(query: string, params?: unknown[]): Promise<[Data]>;
  query<Data>(query: string, params?: unknown[]): Promise<[Data]>;
  end?(): Promise<void>;
}

/**
 * MySQL implementation of the DatabaseAdapter interface.
 *
 * @classdesc
 * Provides database operations for StoryBooker using MySQL as the backend.
 * Uses tables to represent collections and rows to represent documents.
 * Compatible with mysql2, mysql, and other MySQL libraries.
 *
 * Table structure:
 * - Collections metadata: `{prefix}_collections`
 * - Collection tables: `{prefix}_{collectionId}`
 * - Each table has columns: id (VARCHAR PRIMARY KEY), data (JSON), created_at, updated_at
 *
 * @example
 * ```ts
 * import mysql from "mysql2/promise";
 * import { MySQLDatabaseAdapter } from "storybooker/mysql";
 *
 * // Create MySQL connection
 * const connection = await mysql.createConnection({
 *   host: "localhost",
 *   user: "root",
 *   password: "password",
 *   database: "storybooker",
 * });
 * // Initialize the database adapter
 * const database = new MySQLDatabaseAdapter(connection, "sb");
 * await database.init({ abortSignal });
 * // Use the database adapter with StoryBooker
 * const router = createHonoRouter({ database });
 * ```
 *
 * @see {@link https://dev.mysql.com/doc/ | MySQL Documentation}
 */
export class MySQLDatabaseAdapter implements DatabaseAdapter {
  #connection: MySQLConnection;
  #tablePrefix: string;

  /**
   * Creates a new MySQL database adapter instance.
   *
   * @param connection - The MySQL connection object implementing the MySQLConnection interface
   * @param tablePrefix - The prefix for all tables created in MySQL (defaults to "sbr")
   *
   * @example
   * ```ts
   * import mysql from "mysql2/promise";
   * const connection = await mysql.createConnection({ host, user, password, database });
   * const database = new MySQLDatabaseAdapter(connection, "sbr");
   * ```
   */
  constructor(connection: MySQLConnection, tablePrefix = "sbr") {
    this.#connection = connection;
    this.#tablePrefix = tablePrefix;
  }

  metadata: DatabaseAdapter["metadata"] = { name: "MySQL" };

  init: DatabaseAdapter["init"] = async (_options) => {
    // Create collections metadata table
    try {
      const collectionsTable = `${this.#tablePrefix}_collections`;
      await this.#connection.connect?.();
      await this.#connection.execute(`
        CREATE TABLE IF NOT EXISTS \`${collectionsTable}\` (
          id VARCHAR(255) PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
          `);
    } catch (error) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError(error);
    }
  };

  // Helper methods
  #getTableName(collectionId: string): string {
    return `${this.#tablePrefix}_${collectionId}`;
  }

  #getCollectionsTableName(): string {
    return `${this.#tablePrefix}_collections`;
  }

  // oxlint-disable-next-line class-methods-use-this
  #formatDocumentRow<Document extends StoryBookerDatabaseDocument>(row: { id: string }): Document {
    if ("data" in row && typeof row["data"] === "string") {
      return { id: row.id, ...JSON.parse(row["data"]) } as Document;
    }
    return row as unknown as Document;
  }

  listCollections: DatabaseAdapter["listCollections"] = async (_options) => {
    const collectionsTable = this.#getCollectionsTableName();
    const [rows] = await this.#connection.execute<StoryBookerDatabaseDocument[]>(
      `SELECT id FROM \`${collectionsTable}\``,
    );
    return rows.map((row) => row.id);
  };

  createCollection: DatabaseAdapter["createCollection"] = async (collectionId, _options) => {
    try {
      const tableName = this.#getTableName(collectionId);
      const collectionsTable = this.#getCollectionsTableName();

      // Create the collection table
      await this.#connection.execute(`
      CREATE TABLE IF NOT EXISTS \`${tableName}\` (
        id VARCHAR(255) PRIMARY KEY,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

      // Register collection
      await this.#connection.execute(`INSERT IGNORE INTO \`${collectionsTable}\` (id) VALUES (?)`, [
        collectionId,
      ]);
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionAlreadyExistsError(collectionId, error);
    }
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (collectionId, _options) => {
    const collectionsTable = this.#getCollectionsTableName();
    const [rows] = await this.#connection.execute<StoryBookerDatabaseDocument[]>(
      `SELECT 1 FROM \`${collectionsTable}\` WHERE id = ? LIMIT 1`,
      [collectionId],
    );
    return rows.length > 0;
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (collectionId, _options) => {
    const tableName = this.#getTableName(collectionId);
    const collectionsTable = this.#getCollectionsTableName();

    try {
      // Drop the table
      await this.#connection.execute(`DROP TABLE IF EXISTS \`${tableName}\``);

      // Remove from collections registry
      await this.#connection.execute(`DELETE FROM \`${collectionsTable}\` WHERE id = ?`, [
        collectionId,
      ]);
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId, error);
    }
  };

  listDocuments: DatabaseAdapter["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    listOptions: DatabaseDocumentListOptions<Document>,
    _options: DatabaseAdapterOptions,
  ): Promise<Document[]> => {
    const tableName = this.#getTableName(collectionId);

    let query = `SELECT id, data FROM \`${tableName}\``;
    const params: unknown[] = [];

    // Apply string-based filtering (basic WHERE clause support)
    if (listOptions?.filter && typeof listOptions.filter === "string") {
      query += ` WHERE ${listOptions.filter}`;
    }

    // Apply sorting
    if (listOptions?.sort && listOptions.sort === "latest") {
      query += ` ORDER BY created_at DESC`;

      // Function-based sorting will be applied in memory
    }

    // Apply limit
    if (listOptions?.limit && listOptions.limit > 0) {
      query += ` LIMIT ?`;
      params.push(listOptions.limit);
    }

    const [rows] = await this.#connection.execute<Document[]>(query, params);
    let documents: Document[] = [];
    for (const row of rows) {
      documents.push(this.#formatDocumentRow<Document>(row));
    }

    // Apply function-based filtering
    const filterFn =
      listOptions?.filter && typeof listOptions.filter === "function"
        ? listOptions.filter
        : undefined;
    if (filterFn) {
      documents = documents.filter((item) => filterFn(item));
    }

    // Apply function-based sorting
    if (listOptions?.sort && typeof listOptions.sort === "function") {
      documents.sort(listOptions.sort);
    }

    // // Apply field selection (projection)
    // if (listOptions?.select && listOptions.select.length > 0) {
    //   documents = documents.map((doc) => {
    //     const projected = { id: doc.id } as Document;
    //     // oxlint-disable-next-line no-non-null-assertion
    //     for (const field of listOptions.select!) {
    //       if (field in doc) {
    //         projected[field] = doc[field];
    //       }
    //     }
    //     return projected;
    //   });
    // }

    return documents;
  };

  getDocument: DatabaseAdapter["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    _options: DatabaseAdapterOptions,
  ): Promise<Document> => {
    const tableName = this.#getTableName(collectionId);
    const [rows] = await this.#connection.execute<Document[]>(
      `SELECT id, data FROM \`${tableName}\` WHERE id = ? LIMIT 1`,
      [documentId],
    );

    const [row] = rows;
    if (!row) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
    }

    return this.#formatDocumentRow<Document>(row);
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (collectionId, documentId, _options) => {
    const tableName = this.#getTableName(collectionId);
    const [rows] = await this.#connection.execute<Document[]>(
      `SELECT 1 FROM \`${tableName}\` WHERE id = ? LIMIT 1`,
      [documentId],
    );
    return rows.length > 0;
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    _options,
  ) => {
    const tableName = this.#getTableName(collectionId);
    const { id, ...data } = documentData;
    try {
      await this.#connection.execute(`INSERT INTO \`${tableName}\` (id, data) VALUES (?, ?)`, [
        id,
        JSON.stringify(data),
      ]);
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentAlreadyExistsError(
        collectionId,
        documentData.id,
        error,
      );
    }
  };

  updateDocument: DatabaseAdapter["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
  ) => {
    const tableName = this.#getTableName(collectionId);

    // Get existing document
    const [rows] = await this.#connection.execute<StoryBookerDatabaseDocument[]>(
      `SELECT data FROM \`${tableName}\` WHERE id = ? LIMIT 1`,
      [documentId],
    );

    const [row] = rows;
    if (!row) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
    }

    const existingData =
      "data" in row && typeof row["data"] === "string"
        ? (JSON.parse(row["data"]) as Record<string, unknown>)
        : null;
    const updatedData = { ...existingData, ...documentData };

    await this.#connection.execute(`UPDATE \`${tableName}\` SET data = ? WHERE id = ?`, [
      JSON.stringify(updatedData),
      documentId,
    ]);
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (
    collectionId,
    documentId,
    _options,
  ) => {
    const tableName = this.#getTableName(collectionId);
    const [result] = await this.#connection.execute<{ affectedRows: number }>(
      `DELETE FROM \`${tableName}\` WHERE id = ?`,
      [documentId],
    );

    if (result.affectedRows === 0) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
    }
  };
}
