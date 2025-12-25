// oxlint-disable no-explicit-any
// oxlint-disable no-unsafe-member-access

import type { RedisClientType } from "redis";
import {
  DatabaseAdapterErrors,
  type DatabaseAdapter,
  type DatabaseAdapterOptions,
  type DatabaseDocumentListOptions,
  type StoryBookerDatabaseDocument,
} from "./_internal/database.ts";

/**
 * Redis database adapter for StoryBooker.
 * Uses key prefixes to simulate collections since Redis is key-value store.
 *
 * Key structure: `collection:{collectionId}:doc:{documentId}`
 * Collections list key: `collections`
 *
 * Compatible with all Redis services (Redis Cloud, AWS ElastiCache, Azure Cache, etc.)
 */
export class RedisDatabaseAdapter implements DatabaseAdapter {
  #client: RedisClientType;
  #keyPrefix: string;

  constructor(client: RedisClientType, keyPrefix = "sbr") {
    this.#client = client;
    this.#keyPrefix = keyPrefix;
  }

  metadata: DatabaseAdapter["metadata"] = { name: "Redis" };

  init: DatabaseAdapter["init"] = async (_options) => {
    // Ensure Redis connection is ready
    if (!this.#client.isReady) {
      try {
        await this.#client.connect();
      } catch (error) {
        throw new DatabaseAdapterErrors.DatabaseNotInitializedError(error);
      }
    }
  };

  // Helper methods for key generation
  //   #getCollectionKey(collectionId: string): string {
  //     return `${this.#keyPrefix}:collection:${collectionId}`;
  //   }

  #getDocumentKey(collectionId: string, documentId: string): string {
    return `${this.#keyPrefix}:collection:${collectionId}:doc:${documentId}`;
  }

  #getCollectionsSetKey(): string {
    return `${this.#keyPrefix}:collections`;
  }

  listCollections: DatabaseAdapter["listCollections"] = async (_options) => {
    const collections = await this.#client.sMembers(this.#getCollectionsSetKey());
    return collections;
  };

  createCollection: DatabaseAdapter["createCollection"] = async (collectionId, _options) => {
    try {
      // Add collection to the set of collections
      await this.#client.sAdd(this.#getCollectionsSetKey(), collectionId);
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionAlreadyExistsError(collectionId, error);
    }
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (collectionId, _options) => {
    const exists = await this.#client.sIsMember(this.#getCollectionsSetKey(), collectionId);
    return exists > 0;
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (collectionId, _options) => {
    try {
      // Get all document keys for this collection
      const pattern = this.#getDocumentKey(collectionId, "*");
      const keys = await this.#client.keys(pattern);

      // Delete all documents in the collection
      if (keys.length > 0) {
        await this.#client.del(keys);
      }

      // Remove collection from the set
      await this.#client.sRem(this.#getCollectionsSetKey(), collectionId);
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
    const pattern = this.#getDocumentKey(collectionId, "*");
    const keys = await this.#client.keys(pattern);

    if (keys.length === 0) {
      return [];
    }

    // Get all documents
    const values = await this.#client.mGet(keys);
    const documents: Document[] = values
      .filter((value): value is string => value !== null)
      .map((value) => JSON.parse(value) as Document);

    // Apply filtering
    let filteredDocs = documents;
    const filterFn =
      listOptions?.filter && typeof listOptions.filter === "function"
        ? listOptions.filter
        : undefined;
    if (filterFn) {
      filteredDocs = documents.filter((doc) => filterFn(doc));
    }
    // String filters could be implemented as key pattern matching if needed

    // Apply sorting
    if (listOptions?.sort) {
      if (typeof listOptions.sort === "function") {
        filteredDocs.sort(listOptions.sort);
      } else if (listOptions.sort === "latest") {
        // Assume documents have a createdAt or similar timestamp field
        filteredDocs.sort((docA, docB) => {
          const aTime = (docA as any).createdAt ?? (docA as any).timestamp ?? 0;
          const bTime = (docB as any).createdAt ?? (docB as any).timestamp ?? 0;
          return bTime - aTime; // Descending order (latest first)
        });
      }
    }

    // Apply limit
    if (listOptions?.limit && listOptions.limit > 0) {
      filteredDocs = filteredDocs.slice(0, listOptions.limit);
    }

    // // Apply select (field projection)
    // if (listOptions?.select && listOptions.select.length > 0) {
    //   filteredDocs = filteredDocs.map((doc) => {
    //     const projected = { id: doc.id } as Document;
    //     // oxlint-disable-next-line no-non-null-assertion
    //     for (const field of listOptions.select!) {
    //       if (field in doc) {
    //         projected[field] = (doc as any)[field];
    //       }
    //     }
    //     return projected;
    //   });
    // }

    return filteredDocs;
  };

  getDocument: DatabaseAdapter["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    _options: DatabaseAdapterOptions,
  ): Promise<Document> => {
    const key = this.#getDocumentKey(collectionId, documentId);
    const value = await this.#client.get(key);

    if (!value) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
    }

    const document: Document = JSON.parse(value);
    return document;
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (collectionId, documentId, _options) => {
    const key = this.#getDocumentKey(collectionId, documentId);
    const exists = await this.#client.exists(key);
    return exists === 1;
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    _options,
  ) => {
    // Ensure collection exists
    try {
      await this.#client.sAdd(this.#getCollectionsSetKey(), collectionId);
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId, error);
    }

    try {
      const key = this.#getDocumentKey(collectionId, documentData.id);
      const value = JSON.stringify(documentData);
      await this.#client.set(key, value);
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
    const key = this.#getDocumentKey(collectionId, documentId);

    // Get existing document
    const existingValue = await this.#client.get(key);
    if (!existingValue) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
    }

    const existingDoc = JSON.parse(existingValue);
    const updatedDoc = { ...existingDoc, ...documentData };

    const value = JSON.stringify(updatedDoc);
    await this.#client.set(key, value);
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (
    collectionId,
    documentId,
    _options,
  ) => {
    const key = this.#getDocumentKey(collectionId, documentId);
    const deleted = await this.#client.del(key);

    if (deleted === 0) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
    }
  };
}
