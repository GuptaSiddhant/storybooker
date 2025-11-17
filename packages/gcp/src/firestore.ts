import type { Firestore } from "@google-cloud/firestore";
import type {
  DatabaseAdapter,
  DatabaseAdapterOptions,
  DatabaseDocumentListOptions,
  StoryBookerDatabaseDocument,
} from "@storybooker/adapter/database";

export class GcpFirestoreDatabaseAdapter implements DatabaseAdapter {
  #instance: Firestore;

  constructor(instance: Firestore) {
    this.#instance = instance;
  }

  listCollections: DatabaseAdapter["listCollections"] = async (_options) => {
    const collections = await this.#instance.listCollections();
    return collections.map((col) => col.id);
  };

  // oxlint-disable-next-line class-methods-use-this --- NOOP
  createCollection: DatabaseAdapter["createCollection"] = async (
    _collectionId,
    _options,
  ) => {
    // Firestore creates collections implicitly when you add a document.
  };

  hasCollection: DatabaseAdapter["hasCollection"] = async (
    collectionId,
    _options,
  ) => {
    const col = this.#instance.collection(collectionId);
    const snapshot = await col.limit(1).get();
    return !snapshot.empty;
  };

  deleteCollection: DatabaseAdapter["deleteCollection"] = async (
    collectionId,
    _options,
  ) => {
    // Firestore doesn't have a direct way to delete a collection
    // We need to delete all documents in the collection
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
  };

  listDocuments: DatabaseAdapter["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    _listOptions: DatabaseDocumentListOptions<Document>,
    _options: DatabaseAdapterOptions,
  ) => {
    const col = this.#instance.collection(collectionId);
    const snapshot = await col.get();
    const list: Document[] = [];
    for (const doc of snapshot.docs) {
      const data = doc.data() as Document;
      list.push({ ...data, id: doc.id });
    }

    return list;
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
      throw new Error(`Document '${documentId}' not found.`);
    }
    return { ...doc.data(), id: doc.id } as Document;
  };

  createDocument: DatabaseAdapter["createDocument"] = async (
    collectionId,
    documentData,
    _options,
  ) => {
    const docRef = this.#instance.collection(collectionId).doc(documentData.id);
    await docRef.create(documentData);
  };

  hasDocument: DatabaseAdapter["hasDocument"] = async (
    collectionId,
    documentId,
    _options,
  ) => {
    const docRef = this.#instance.collection(collectionId).doc(documentId);
    const doc = await docRef.get();
    return doc.exists;
  };

  deleteDocument: DatabaseAdapter["deleteDocument"] = async (
    collectionId,
    documentId,
    _options,
  ) => {
    const docRef = this.#instance.collection(collectionId).doc(documentId);
    await docRef.delete();
  };

  updateDocument: DatabaseAdapter["updateDocument"] = async (
    collectionId,
    documentId,
    documentData,
  ) => {
    const docRef = this.#instance.collection(collectionId).doc(documentId);
    await docRef.set(documentData, {
      merge: true,
      mergeFields: Object.keys(documentData),
    });
  };
}
