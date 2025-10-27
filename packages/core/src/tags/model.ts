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
  TagCreateSchema,
  TagSchema,
  TagUpdateSchema,
  type TagType,
} from "./schema";

export class TagsModel extends Model<TagType> {
  constructor(projectId: string) {
    super(projectId, generateDatabaseCollectionId(projectId, "Tags"));
  }

  async list(options: ListOptions<TagType> = {}): Promise<TagType[]> {
    this.log("List tags...");

    const items = await this.database.listDocuments(
      this.collectionId,
      options,
      this.dbOptions,
    );

    return TagSchema.array().parse(items);
  }

  async create(data: unknown, withBuild = false): Promise<TagType> {
    const parsedData = TagCreateSchema.parse(data);
    this.log("Create tag '%s'...", parsedData.value);

    const slug = TagsModel.createSlug(parsedData.value);
    const now = new Date().toISOString();
    const tag: TagType = {
      ...parsedData,
      buildsCount: withBuild ? 1 : 0,
      createdAt: now,
      id: slug,
      slug,
      updatedAt: now,
    };
    await this.database.createDocument<TagType>(
      this.collectionId,
      tag,
      this.dbOptions,
    );

    return tag;
  }

  async get(id: string): Promise<TagType> {
    this.log("Get tag '%s'...", id);

    const item = await this.database.getDocument(
      this.collectionId,
      id,
      this.dbOptions,
    );

    return TagSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    this.log("Check tag '%s'...", id);
    return await this.database.hasDocument(
      this.collectionId,
      id,
      this.dbOptions,
    );
  }

  async update(id: string, data: unknown): Promise<void> {
    this.log("Update tag '%s'...", id);
    const parsedData = TagUpdateSchema.parse(data);

    await this.database.updateDocument(
      this.collectionId,
      id,
      { ...parsedData, updatedAt: new Date().toISOString() },
      this.dbOptions,
    );

    return;
  }

  async delete(slug: string): Promise<void> {
    this.log("Delete tag '%s'...", slug);

    const { gitHubDefaultBranch } = await new ProjectsModel().get(
      this.projectId,
    );
    if (slug === TagsModel.createSlug(gitHubDefaultBranch)) {
      const message = `Cannot delete the tag associated with default branch (${gitHubDefaultBranch}) of the project '${this.projectId}'.`;
      this.error(message);
      throw new Error(message);
    }

    await this.database.deleteDocument(this.collectionId, slug, this.dbOptions);

    try {
      this.debug("Delete builds associated with tag '%s'...", slug);
      await new BuildsModel(this.projectId).deleteByTag(slug, false);
    } catch (error) {
      this.error(error);
    }

    return;
  }

  checkAuth = async (action: PermissionAction): Promise<boolean> => {
    return await checkAuthorisation({
      action,
      projectId: this.projectId,
      resource: "tag",
    });
  };

  id: BaseModel<TagType>["id"] = (id: string) => {
    return {
      checkAuth: (action) =>
        checkAuthorisation({
          action,
          projectId: this.projectId,
          resource: "tag",
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

  static guessType(slug: string): TagType["type"] {
    if (/^\d+$/.test(slug)) {
      return "pr";
    }
    if (/^\w+-\d+$/.test(slug)) {
      return "jira";
    }
    return "branch";
  }
}
