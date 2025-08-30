import { BuildsModel } from "#builds/model";
import { ProjectsModel } from "#projects/model";
import {
  generateProjectCollectionName,
  type BaseModel,
  type ListOptions,
} from "#utils/shared-model";
import { getStore } from "#utils/store";
import {
  LabelCreateSchema,
  LabelSchema,
  LabelUpdateSchema,
  type LabelType,
} from "./schema";

export class LabelsModel implements BaseModel<LabelType> {
  projectId: string;
  #collectionName: string;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.#collectionName = generateProjectCollectionName(projectId, "Labels");
  }

  #log(...args: unknown[]): void {
    getStore().logger.log(`[${this.projectId}]`, ...args);
  }

  async list(options?: ListOptions<LabelType>): Promise<LabelType[]> {
    this.#log("List labels...");
    const { database } = getStore();
    const items = await database.listDocuments(this.#collectionName, options);

    return LabelSchema.array().parse(items);
  }

  async create(data: unknown): Promise<LabelType> {
    const { database } = getStore();
    const parsedData = LabelCreateSchema.parse(data);
    this.#log("Create label '%s'...", parsedData.value);

    const slug = LabelsModel.createSlug(parsedData.value);
    const now = new Date().toISOString();
    const label: LabelType = {
      ...parsedData,
      createdAt: now,
      id: slug,
      slug,
      updatedAt: now,
    };
    await database.createDocument<LabelType>(this.#collectionName, label);

    return label;
  }

  async get(id: string): Promise<LabelType> {
    this.#log("Get label '%s''...", id);
    const { database } = getStore();
    const item = await database.getDocument(this.#collectionName, id);

    return LabelSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    return await this.get(id)
      .then(() => true)
      .catch(() => false);
  }

  async update(id: string, data: unknown): Promise<void> {
    this.#log("Update label '%s''...", id);
    const parsedData = LabelUpdateSchema.parse(data);
    const { database } = getStore();
    await database.updateDocument(this.#collectionName, id, {
      ...parsedData,
      updatedAt: new Date().toISOString(),
    });

    return;
  }

  async delete(slug: string): Promise<void> {
    this.#log("Delete label '%s''...", slug);
    const { gitHubDefaultBranch } = await new ProjectsModel().get(
      this.projectId,
    );
    if (slug === LabelsModel.createSlug(gitHubDefaultBranch)) {
      const message = `Cannot delete the label associated with default branch (${gitHubDefaultBranch}) of the project '${this.projectId}'.`;
      this.#log("[ERROR]", message);
      throw new Error(message);
    }

    const { database } = getStore();
    await database.deleteDocument(this.#collectionName, slug);
    await new BuildsModel(this.projectId).deleteByLabel(slug, false);

    return;
  }

  id: BaseModel<LabelType>["id"] = (id: string) => {
    return {
      delete: this.delete.bind(this, id),
      get: this.get.bind(this, id),
      has: this.has.bind(this, id),
      id,
      update: this.update.bind(this, id),
    };
  };

  static createSlug(value: string): string {
    return value.trim().toLowerCase().replace(/\W+/, "-");
  }

  static guessType(slug: string): LabelType["type"] {
    if (/^\d+$/.test(slug)) {
      return "pr";
    }
    if (/^\w+-\d+$/.test(slug)) {
      return "jira";
    }
    return "branch";
  }
}
