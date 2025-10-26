import { BuildsModel } from "../builds/model";
import { ProjectsModel } from "../projects/model";
import type { PermissionAction } from "../types";
import { checkAuthorisation } from "../utils/auth";
import {
  generateDatabaseCollectionId,
  Model,
  type BaseModel,
  type ListOptions,
} from "../utils/shared-model";
import {
  LabelCreateSchema,
  LabelSchema,
  LabelUpdateSchema,
  type LabelType,
} from "./schema";

export class LabelsModel extends Model<LabelType> {
  constructor(projectId: string) {
    super(projectId, generateDatabaseCollectionId(projectId, "Labels"));
  }

  async list(options: ListOptions<LabelType> = {}): Promise<LabelType[]> {
    this.log("List labels...");

    const items = await this.database.listDocuments(
      this.collectionId,
      options,
      this.dbOptions,
    );

    return LabelSchema.array().parse(items);
  }

  async create(data: unknown, withBuild = false): Promise<LabelType> {
    const parsedData = LabelCreateSchema.parse(data);
    this.log("Create label '%s'...", parsedData.value);

    const slug = LabelsModel.createSlug(parsedData.value);
    const now = new Date().toISOString();
    const label: LabelType = {
      ...parsedData,
      buildsCount: withBuild ? 1 : 0,
      createdAt: now,
      id: slug,
      slug,
      updatedAt: now,
    };
    await this.database.createDocument<LabelType>(
      this.collectionId,
      label,
      this.dbOptions,
    );

    return label;
  }

  async get(id: string): Promise<LabelType> {
    this.log("Get label '%s'...", id);

    const item = await this.database.getDocument(
      this.collectionId,
      id,
      this.dbOptions,
    );

    return LabelSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    this.log("Check label '%s'...", id);
    return await this.database.hasDocument(
      this.collectionId,
      id,
      this.dbOptions,
    );
  }

  async update(id: string, data: unknown): Promise<void> {
    this.log("Update label '%s'...", id);
    const parsedData = LabelUpdateSchema.parse(data);

    await this.database.updateDocument(
      this.collectionId,
      id,
      { ...parsedData, updatedAt: new Date().toISOString() },
      this.dbOptions,
    );

    return;
  }

  async delete(slug: string): Promise<void> {
    this.log("Delete label '%s'...", slug);

    const { gitHubDefaultBranch } = await new ProjectsModel().get(
      this.projectId,
    );
    if (slug === LabelsModel.createSlug(gitHubDefaultBranch)) {
      const message = `Cannot delete the label associated with default branch (${gitHubDefaultBranch}) of the project '${this.projectId}'.`;
      this.error(message);
      throw new Error(message);
    }

    await this.database.deleteDocument(this.collectionId, slug, this.dbOptions);

    try {
      this.debug("Delete builds associated with label '%s'...", slug);
      await new BuildsModel(this.projectId).deleteByLabel(slug, false);
    } catch (error) {
      this.error(error);
    }

    return;
  }

  checkAuth = async (action: PermissionAction): Promise<boolean> => {
    return await checkAuthorisation({
      action,
      projectId: this.projectId,
      resource: "label",
    });
  };

  id: BaseModel<LabelType>["id"] = (id: string) => {
    return {
      checkAuth: (action) =>
        checkAuthorisation({
          action,
          projectId: this.projectId,
          resource: "label",
        }),
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
