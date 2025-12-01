import { HTTPException } from "hono/http-exception";
import type { StoryBookerPermissionAction } from "../adapters/auth";
import { generateDatabaseCollectionId } from "../utils/adapter-utils";
import { checkAuthorisation } from "../utils/auth";
import { Model, type BaseModel, type ListOptions } from "./~model";
import { BuildsModel } from "./builds-model";
import { ProjectsModel } from "./projects-model";
import {
  TagSchema,
  type TagCreateType,
  type TagType,
  type TagUpdateType,
} from "./tags-schema";

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

  async create(data: TagCreateType, withBuild = false): Promise<TagType> {
    this.log("Create tag '%s'...", data.value);
    const id = TagsModel.createId(data.value);

    try {
      if (await this.has(id)) {
        throw new HTTPException(409, {
          message: `Tag '${id}' already exists.`,
        });
      }

      const now = new Date().toISOString();
      const tag: TagType = {
        ...data,
        buildsCount: withBuild ? 1 : 0,
        createdAt: now,
        id: id,
        updatedAt: now,
      };
      await this.database.createDocument<TagType>(
        this.collectionId,
        tag,
        this.dbOptions,
      );

      return tag;
    } catch (error) {
      throw new HTTPException(500, {
        cause: error,
        message: `Failed to create tag '${id}'.`,
      });
    }
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
    try {
      return await this.database.hasDocument(
        this.collectionId,
        id,
        this.dbOptions,
      );
    } catch {
      return false;
    }
  }

  async update(id: string, data: TagUpdateType): Promise<void> {
    this.log("Update tag '%s'...", id);

    await this.database.updateDocument(
      this.collectionId,
      id,
      { ...data, updatedAt: new Date().toISOString() },
      this.dbOptions,
    );

    return;
  }

  async delete(id: string): Promise<void> {
    this.log("Delete tag '%s'...", id);

    const { gitHubDefaultBranch } = await new ProjectsModel().get(
      this.projectId,
    );
    if (id === TagsModel.createId(gitHubDefaultBranch)) {
      const message = `Cannot delete the tag associated with default branch (${gitHubDefaultBranch}) of the project '${this.projectId}'.`;
      this.error(message);
      throw new Error(message);
    }

    await this.database.deleteDocument(this.collectionId, id, this.dbOptions);

    try {
      this.debug("Delete builds associated with tag '%s'...", id);
      await new BuildsModel(this.projectId).deleteByTag(id, false);
    } catch (error) {
      this.error(error);
    }

    return;
  }

  checkAuth = async (action: StoryBookerPermissionAction): Promise<boolean> => {
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

  static createId(value: string): string {
    return value.trim().toLowerCase().replace(/\W+/, "-");
  }

  static guessType(id: string): TagType["type"] {
    if (/^\d+$/.test(id)) {
      return "pr";
    }
    if (/^\w+-\d+$/.test(id)) {
      return "jira";
    }
    return "branch";
  }
}
