// oxlint-disable max-lines
// oxlint-disable max-params
// oxlint-disable sort-keys
// oxlint-disable no-explicit-any
// oxlint-disable no-unsafe-member-access

import {
  DatabaseAdapterErrors,
  type DatabaseAdapter,
  type DatabaseAdapterOptions,
  type DatabaseDocumentListOptions,
  type StoryBookerDatabaseDocument,
} from "storybooker/adapter/~database";

/**
 * Vercel Edge Config database adapter for StoryBooker.
 * Uses Edge Config for ultra-fast reads with limited write capabilities.
 *
 * Key structure: Collections are simulated using key prefixes
 * - Collection list: stored at key "collections"
 * - Documents: stored with keys like "collection:{collectionId}:doc:{documentId}"
 *
 * Note: Edge Config is optimized for reads. Writes require API calls and take time to propagate.
 * Compatible with Vercel Edge Config service.
 */
export class VercelEdgeConfigDatabaseService implements DatabaseAdapter {
  #apiToken: string;
  #configId: string;
  #teamId?: string;
  #keyPrefix: string;

  constructor(options: {
    apiToken: string;
    configId: string;
    teamId?: string;
    keyPrefix?: string;
  }) {
    this.#apiToken = options.apiToken;
    this.#configId = options.configId;
    this.#teamId = options?.teamId;
    this.#keyPrefix = options?.keyPrefix || "sbr";
  }

  metadata: DatabaseAdapter["metadata"] = {
    name: "Vercel Edge Config",
  };

  init: DatabaseAdapter["init"] = async (_options) => {
    // Edge Config doesn't require explicit initialization
    // Just verify we can read from it
    try {
      await this.#requestEdgeConfigAPI<string>("GET", "digest");
    } catch (error) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError(error);
    }
  };

  // Helper methods for key generation
  #getDocumentKey(collectionId: string, documentId: string): string {
    return `${this.#keyPrefix}_-_collection_-_${collectionId}_-_doc_-_${documentId}`;
  }

  #getCollectionsKey(): string {
    return `${this.#keyPrefix}_-_collections`;
  }

  listCollections: DatabaseAdapter["listCollections"] = async (options) => {
    try {
      const collections = await this.#getItem<string[]>(
        this.#getCollectionsKey(),
        options?.abortSignal,
      );
      return collections || [];
    } catch (error) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError(error);
    }
  };

  createCollection: DatabaseAdapter["createCollection"] = async (collectionId, options) => {
    // Get current collections list
    const currentCollections = await this.listCollections(options).catch((): string[] => []);

    if (currentCollections.includes(collectionId)) {
      throw new DatabaseAdapterErrors.CollectionAlreadyExistsError(collectionId);
    }

    try {
      // Add collection to the list
      const updatedCollections = [...currentCollections, collectionId];
      await this.#updateItems(
        [{ operation: "upsert", key: this.#getCollectionsKey(), value: updatedCollections }],
        options.abortSignal,
      );
    } catch (error) {
      if (error instanceof DatabaseAdapterErrors.CollectionAlreadyExistsError) {
        throw error;
      }
      throw new DatabaseAdapterErrors.CollectionAlreadyExistsError(collectionId, error);
    }
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (collectionId, options) => {
    try {
      const collections = await this.listCollections(options);
      return collections.includes(collectionId);
    } catch {
      return false;
    }
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (collectionId, options) => {
    try {
      // Get all keys and find documents in this collection
      const allData = await this.#getAllItems(options.abortSignal);
      const keysToDelete: string[] = [];
      const documentPrefix = `${this.#keyPrefix}:collection:${collectionId}:doc:`;

      for (const key in allData) {
        if (key.startsWith(documentPrefix)) {
          keysToDelete.push(key);
        }
      }

      // Get current collections list and remove this collection
      const currentCollections = await this.listCollections(options);
      const updatedCollections = currentCollections.filter((id) => id !== collectionId);

      // Build operations to delete all documents and update collections list
      await this.#updateItems(
        [
          ...keysToDelete.map((key) => ({
            operation: "delete" as const,
            key,
          })),
          {
            operation: "upsert" as const,
            key: this.#getCollectionsKey(),
            value: updatedCollections,
          },
        ],
        options.abortSignal,
      );
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId, error);
    }
  };

  listDocuments: DatabaseAdapter["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    listOptions: DatabaseDocumentListOptions<Document>,
    options: DatabaseAdapterOptions,
  ): Promise<Document[]> => {
    try {
      // Get all data and filter for this collection's documents
      const allData = await this.#getAllItems(options.abortSignal);
      const documentPrefix = `${this.#keyPrefix}:collection:${collectionId}:doc:`;
      const documents: Document[] = [];

      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith(documentPrefix) && value) {
          documents.push(value as Document);
        }
      }

      // Apply filtering
      let filteredDocs = documents;
      const filterFn =
        listOptions?.filter && typeof listOptions.filter === "function"
          ? listOptions.filter
          : undefined;
      if (filterFn) {
        filteredDocs = documents.filter((doc) => filterFn(doc));
      }

      // Apply sorting
      if (listOptions?.sort) {
        if (typeof listOptions.sort === "function") {
          filteredDocs.sort(listOptions.sort);
        } else if (listOptions.sort === "latest") {
          // Assume documents have a createdAt or similar timestamp field
          filteredDocs.sort((docA, docB) => {
            const aTime = (docA as any).createdAt || (docA as any).timestamp || 0;
            const bTime = (docB as any).createdAt || (docB as any).timestamp || 0;
            return bTime - aTime; // Descending order (latest first)
          });
        }
      }

      // Apply limit
      if (listOptions?.limit && listOptions.limit > 0) {
        filteredDocs = filteredDocs.slice(0, listOptions.limit);
      }

      return filteredDocs;
    } catch (error) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError(error);
    }
  };

  getDocument: DatabaseAdapter["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    _options: DatabaseAdapterOptions,
  ): Promise<Document> => {
    const key = this.#getDocumentKey(collectionId, documentId);

    try {
      const document = await this.#getItem<Document>(key);

      if (!document) {
        throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
      }

      return document;
    } catch (error) {
      if (error instanceof DatabaseAdapterErrors.DocumentDoesNotExistError) {
        throw error;
      }
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (collectionId, documentId, options) => {
    const key = this.#getDocumentKey(collectionId, documentId);
    return await this.#hasItem(key, options.abortSignal);
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    options,
  ) => {
    try {
      // Ensure collection exists
      const collections = await this.listCollections(options);
      let operations: Operation[] = [];

      if (!collections.includes(collectionId)) {
        operations.push({
          operation: "upsert",
          key: this.#getCollectionsKey(),
          value: [...collections, collectionId],
        });
      }

      // Check if document already exists
      const key = this.#getDocumentKey(collectionId, documentData.id);
      const exists = await this.#hasItem(key, options.abortSignal);

      if (exists) {
        throw new DatabaseAdapterErrors.DocumentAlreadyExistsError(collectionId, documentData.id);
      }

      operations.push({
        operation: "create",
        key,
        value: documentData,
      });

      await this.#updateItems(operations);
    } catch (error) {
      if (error instanceof DatabaseAdapterErrors.DocumentAlreadyExistsError) {
        throw error;
      }
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
    options,
  ) => {
    try {
      const key = this.#getDocumentKey(collectionId, documentId);

      // Get existing document
      const existingDoc = await this.#getItem<StoryBookerDatabaseDocument>(
        key,
        options.abortSignal,
      );
      if (!existingDoc) {
        throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
      }

      const updatedDoc = { ...existingDoc, ...documentData };

      await this.#updateItems([
        {
          operation: "update",
          key,
          value: updatedDoc,
        },
      ]);
    } catch (error) {
      if (error instanceof DatabaseAdapterErrors.DocumentDoesNotExistError) {
        throw error;
      }
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (collectionId, documentId, options) => {
    try {
      const key = this.#getDocumentKey(collectionId, documentId);

      // Check if document exists
      const exists = await this.#hasItem(key, options.abortSignal);
      if (!exists) {
        throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
      }

      await this.#updateItems([{ operation: "delete", key }]);
    } catch (error) {
      if (error instanceof DatabaseAdapterErrors.DocumentDoesNotExistError) {
        throw error;
      }
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };

  // Helper method to update Edge Config via Vercel API
  async #updateItems(operations: Operation[], abortSignal?: AbortSignal): Promise<void> {
    await this.#requestEdgeConfigAPI("PATCH", operations, abortSignal);
  }

  async #getAllItems(abortSignal?: AbortSignal): Promise<Record<string, any>> {
    return await this.#requestEdgeConfigAPI<Record<string, any>>("GET", "items", abortSignal);
  }
  async #getItem<Result>(key: string, abortSignal?: AbortSignal): Promise<Result> {
    return await this.#requestEdgeConfigAPI<Result>("GET", `item/${key}`, abortSignal);
  }
  async #hasItem(key: string, abortSignal?: AbortSignal): Promise<boolean> {
    try {
      await this.#requestEdgeConfigAPI("HEAD", `item/${key}`, abortSignal);
      return true;
    } catch {
      return false;
    }
  }

  //
  async #requestEdgeConfigAPI<Result>(
    method: "HEAD" | "GET",
    path: string,
    abortSignal?: AbortSignal,
  ): Promise<Result>;
  async #requestEdgeConfigAPI<Result>(
    method: "PATCH",
    operations: Operation[],
    abortSignal?: AbortSignal,
  ): Promise<Result>;
  async #requestEdgeConfigAPI<Result>(
    method: "HEAD" | "GET" | "PATCH",
    pathOrOperations: string | Operation[],
    abortSignal?: AbortSignal,
  ): Promise<Result> {
    const url =
      method === "PATCH"
        ? new URL(`https://api.vercel.com/v1/edge-config/${this.#configId}/items`)
        : new URL(
            `https://edge-config.vercel.com/${this.#configId}/${pathOrOperations.toString()}`,
          );
    if (this.#teamId) {
      url.searchParams.append("teamId", this.#teamId);
    }

    const response = await fetch(url, {
      // oxlint-disable-next-line no-invalid-fetch-options
      body: method === "PATCH" ? JSON.stringify({ items: pathOrOperations }) : undefined,
      headers: { Authorization: `Bearer ${this.#apiToken}`, "Content-Type": "application/json" },
      method,
      signal: abortSignal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Failed Edge Config request: ${error.message || response.statusText}`);
    }

    return response.json() as Result;
  }
}

interface Operation {
  operation: "create" | "update" | "upsert" | "delete";
  key: string;
  value?: any;
}
