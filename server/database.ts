// oxlint-disable no-undef
// deno-lint-ignore-file require-await
// oxlint-disable explicit-module-boundary-types
// oxlint-disable explicit-function-return-type
// oxlint-disable require-await

import type {
  DatabaseDocumentListOptions,
  DatabaseService,
} from "../packages/core/dist/index.d.ts";

const filename = "server/db.json";

interface BaseItem {
  id: string;
}
export class FileDatabase implements DatabaseService {
  #db: Record<string, Record<string, BaseItem>> = {};

  constructor() {
    try {
      const db = Deno.readTextFileSync(filename);
      this.#db = db ? JSON.parse(db) : {};
    } catch {
      Deno.create(filename);
    }
  }

  async #saveToFile() {
    await Deno.writeTextFile(filename, JSON.stringify(this.#db, null, 2));
  }

  createCollection = async (name: string) => {
    if (!this.#db[name]) {
      this.#db[name] = {};
    }
    await this.#saveToFile();
  };
  deleteCollection = async (name: string) => {
    // oxlint-disable-next-line no-dynamic-delete
    delete this.#db[name];
    await this.#saveToFile();
  };
  listCollections = async () => {
    return Object.keys(this.#db);
  };
  listDocuments = async <Item extends BaseItem>(
    name: string,
    options?: DatabaseDocumentListOptions<Item>,
  ): Promise<Item[]> => {
    if (!Object.hasOwn(this.#db, name)) {
      throw new Error(`No collection - ${name}`);
    }
    const { limit = Number.POSITIVE_INFINITY, sort, filter } = options || {};
    // oxlint-disable-next-line no-non-null-assertion
    const items = Object.values(this.#db[name]) as Item[];
    if (sort && typeof sort === "function") {
      items.sort(sort);
    }
    if (filter && typeof filter === "function") {
      return items.filter(filter).slice(0, limit);
    }

    return items.slice(0, limit);
  };
  getDocument = async <Item extends BaseItem>(name: string, id: string) => {
    if (!Object.hasOwn(this.#db, name)) {
      throw new Error(`No collection - ${name}`);
    }
    const item = this.#db[name][id];
    if (!item) {
      throw new Error(`Item '${id}' not found in collection '${name}'`);
    }
    return item as Item;
  };
  createDocument = async (name: string, item: BaseItem) => {
    if (!Object.hasOwn(this.#db, name)) {
      throw new Error(`No collection - ${name}`);
    }
    if (this.#db[name][item.id]) {
      throw new Error(
        `Item '${item.id}' already exists in collection '${name}'`,
      );
    }
    this.#db[name][item.id] = item;
    await this.#saveToFile();
  };
  deleteDocument = async (name: string, id: string) => {
    if (!Object.hasOwn(this.#db, name)) {
      throw new Error(`No collection - ${name}`);
    }
    if (!(await this.getDocument(name, id))) {
      throw new Error(`Item '${id}' not found in collection '${name}'`);
    }
    // oxlint-disable-next-line no-dynamic-delete
    delete this.#db[name][id];
    await this.#saveToFile();
  };
  updateDocument = async (
    name: string,
    id: string,
    item: Partial<BaseItem>,
  ) => {
    if (!Object.hasOwn(this.#db, name)) {
      throw new Error(`No collection - ${name}`);
    }
    const prevItem = await this.getDocument(name, id);
    if (!prevItem) {
      throw new Error(`Item '${id}' not found in collection '${name}'`);
    }
    this.#db[name][id] = { ...prevItem, ...item, id };
    await this.#saveToFile();
  };
}
