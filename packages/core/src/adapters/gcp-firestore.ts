import type { Firestore } from "@google-cloud/firestore";
import {
  DatabaseAdapterErrors,
  type DatabaseAdapter,
  type DatabaseAdapterOptions,
  type DatabaseDocumentListOptions,
  type StoryBookerDatabaseDocument,
} from "./_internal/database.ts";

/**
 * Google Cloud Firestore implementation of the DatabaseAdapter interface.
 *
 * @classdesc
 * Provides database operations for StoryBooker using Google Cloud Firestore as the backend.
 * Supports NoSQL collections and documents with automatic error handling.
 *
 * @example
 * ```ts
 * import { Firestore } from "@google-cloud/firestore";
 * import { GcpFirestoreDatabaseAdapter } from "storybooker/gcp-firestore";
 *
 * // Create Firestore instance
 * const firestore = new Firestore({ projectId: "my-project" });
 * // Initialize the database adapter
 * const database = new GcpFirestoreDatabaseAdapter(firestore);
 * // Use the database adapter with StoryBooker
 * const router = createHonoRouter({ database });
 * ```
 *
 * @see {@link https://cloud.google.com/firestore/docs | Google Cloud Firestore Documentation}
 */
export class GcpFirestoreDatabaseAdapter implements DatabaseAdapter {
  #instance: Firestore;

  /**
   * Creates a new Google Cloud Firestore database adapter instance.
   *
   * @param instance - The authenticated Firestore instance for connecting to Google Cloud Firestore
   *
   * @example
   * ```ts
   * import { Firestore } from "@google-cloud/firestore";
   * const firestore = new Firestore({ projectId: "my-project" });
   * const database = new GcpFirestoreDatabaseAdapter(firestore);
   * ```
   */
  constructor(instance: Firestore) {
    this.#instance = instance;
  }

  get metadata(): DatabaseAdapter["metadata"] {
    return {
      name: "Google Cloud Firestore",
      description: "NoSQL database using Google Cloud Firestore collections and documents.",
      id: this.#instance.databaseId,
    };
  }

  listCollections: DatabaseAdapter["listCollections"] = async (_options) => {
    try {
      const collections = await this.#instance.listCollections();
      return collections.map((col) => col.id);
    } catch (error) {
      throw new DatabaseAdapterErrors.DatabaseNotInitializedError(error);
    }
  };

  // oxlint-disable-next-line class-methods-use-this --- NOOP
  createCollection: DatabaseAdapter["createCollection"] = async (_collectionId, _options) => {
    // Firestore creates collections implicitly when you add a document.
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (collectionId, _options) => {
    const col = this.#instance.collection(collectionId);
    const snapshot = await col.limit(1).get();
    return !snapshot.empty;
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (collectionId, _options) => {
    // Firestore doesn't have a direct way to delete a collection
    // We need to delete all documents in the collection
    try {
      const col = this.#instance.collection(collectionId);
      const snapshot = await col.get();
      if (snapshot.empty) {
        return;
      }
      const batch = this.#instance.batch();
      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId, error);
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
      const col = this.#instance.collection(collectionId);
      const snapshot = await col.get();
      const list: Document[] = [];
      for (const doc of snapshot.docs) {
        const data = doc.data() as Document;
        list.push({ ...data, id: doc.id });
      }

      return list;
    } catch (error) {
      throw new DatabaseAdapterErrors.CollectionDoesNotExistError(collectionId, error);
    }
  };

  getDocument: DatabaseAdapter["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    _options: DatabaseAdapterOptions,
  ) => {
    const docRef = this.#instance.collection(collectionId).doc(documentId);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId);
    }
    return { ...doc.data(), id: doc.id } as Document;
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    _options,
  ) => {
    try {
      const docRef = this.#instance.collection(collectionId).doc(documentData.id);
      await docRef.create(documentData);
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentAlreadyExistsError(
        collectionId,
        documentData.id,
        error,
      );
    }
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (collectionId, documentId, _options) => {
    const docRef = this.#instance.collection(collectionId).doc(documentId);
    const doc = await docRef.get();
    return doc.exists;
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (
    collectionId,
    documentId,
    _options,
  ) => {
    try {
      const docRef = this.#instance.collection(collectionId).doc(documentId);
      await docRef.delete();
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };

  updateDocument: DatabaseAdapter["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
  ) => {
    try {
      const docRef = this.#instance.collection(collectionId).doc(documentId);
      await docRef.set(documentData, {
        merge: true,
        mergeFields: Object.keys(documentData),
      });
    } catch (error) {
      throw new DatabaseAdapterErrors.DocumentDoesNotExistError(collectionId, documentId, error);
    }
  };
}
