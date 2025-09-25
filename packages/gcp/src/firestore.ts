import { Firestore, type Settings } from "@google-cloud/firestore";
import type {
  DatabaseDocumentListOptions,
  DatabaseService,
  DatabaseServiceOptions,
  StoryBookerDatabaseDocument,
} from "@storybooker/core/types";

export class GcpFirestoreDatabaseService implements DatabaseService {
  #instance: Firestore;

  constructor(instance: Firestore);
  constructor(settings: Settings);
  constructor(instanceOrSettings: Firestore | Settings) {
    this.#instance =
      instanceOrSettings instanceof Firestore
        ? instanceOrSettings
        : new Firestore(instanceOrSettings);
  }

  listCollections: DatabaseService["listCollections"] = async (_options) => {
    const collections = await this.#instance.listCollections();
    return collections.map((col) => col.id);
  };

  // oxlint-disable-next-line class-methods-use-this --- NOOP
  createCollection: DatabaseService["createCollection"] = async (
    _collectionId,
    _options,
  ) => {
    // Firestore creates collections implicitly when you add a document.
  };

  hasCollection: DatabaseService["hasCollection"] = async (
    collectionId,
    _options,
  ) => {
    const col = this.#instance.collection(collectionId);
    const snapshot = await col.limit(1).get();
    return !snapshot.empty;
  };

  deleteCollection: DatabaseService["deleteCollection"] = async (
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

  listDocuments: DatabaseService["listDocuments"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    _listOptions: DatabaseDocumentListOptions<Document>,
    _options: DatabaseServiceOptions,
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

  getDocument: DatabaseService["getDocument"] = async <
    Document extends StoryBookerDatabaseDocument,
  >(
    collectionId: string,
    documentId: string,
    _options: DatabaseServiceOptions,
  ) => {
    const docRef = this.#instance.collection(collectionId).doc(documentId);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Document '${documentId}' not found.`);
    }
    return { ...doc.data(), id: doc.id } as Document;
  };

  createDocument: DatabaseService["createDocument"] = async (
    collectionId,
    documentData,
    _options,
  ) => {
    const docRef = this.#instance.collection(collectionId).doc(documentData.id);
    await docRef.create(documentData);
  };

  hasDocument: DatabaseService["hasDocument"] = async (
    collectionId,
    documentId,
    _options,
  ) => {
    const docRef = this.#instance.collection(collectionId).doc(documentId);
    const doc = await docRef.get();
    return doc.exists;
  };

  deleteDocument: DatabaseService["deleteDocument"] = async (
    collectionId,
    documentId,
    _options,
  ) => {
    const docRef = this.#instance.collection(collectionId).doc(documentId);
    await docRef.delete();
  };

  updateDocument: DatabaseService["updateDocument"] = async (
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
