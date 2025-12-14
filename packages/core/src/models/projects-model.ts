import { HTTPException } from "hono/http-exception";
import type { StoryBookerPermissionAction } from "../adapters/auth.ts";
import {
  generateDatabaseCollectionId,
  generateStorageContainerId,
} from "../utils/adapter-utils.ts";
import { checkAuthorisation } from "../utils/auth.ts";
import { Model, type BaseModel, type ListOptions } from "./~model.ts";
import {
  ProjectSchema,
  type ProjectCreateType,
  type ProjectType,
  type ProjectUpdateType,
} from "./projects-schema.ts";
import { TagsModel } from "./tags-model.ts";

export class ProjectsModel extends Model<ProjectType> {
  constructor() {
    super(null, generateDatabaseCollectionId("Projects", ""));
  }

  async list(options: ListOptions<ProjectType> = {}): Promise<ProjectType[]> {
    this.log("List projects...");

    try {
      const items = await this.database.listDocuments(this.collectionId, options, this.dbOptions);

      return items;
    } catch (error) {
      this.error("Error listing projects:", error);
      return [];
    }
  }

  async create(data: ProjectCreateType): Promise<ProjectType> {
    this.log("Creating project...");

    const projectId = data.id;

    try {
      if (await this.has(projectId)) {
        throw new HTTPException(409, {
          message: `Project '${projectId}' already exists.`,
        });
      }

      await this.storage.createContainer(
        generateStorageContainerId(projectId),
        this.storageOptions,
      );

      this.debug("Creating project collection");
      await this.database
        .createCollection(this.collectionId, this.dbOptions)
        .catch((error: unknown) => {
          // ignore error if collection already exists since there can only be one projects collection
          this.error("Error creating projects collection:", error);
        });

      await this.database.createCollection(
        generateDatabaseCollectionId(projectId, "Builds"),
        this.dbOptions,
      );

      await this.database.createCollection(
        generateDatabaseCollectionId(projectId, "Tags"),
        this.dbOptions,
      );

      this.debug("Creating default branch (%s) tag", data.gitHubDefaultBranch);
      await new TagsModel(projectId)
        .create({
          type: "branch",
          value: data.gitHubDefaultBranch,
        })
        .catch((error: unknown) => {
          // log error but continue since project creation should not fail because of tag creation
          this.error("Error creating default branch tag:", error);
        });

      this.debug("Creating project entry '%s' in collection", projectId);
      const now = new Date().toISOString();
      const project: ProjectType = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      await this.database.createDocument(this.collectionId, project, this.dbOptions);

      return project;
    } catch (error) {
      throw new HTTPException(500, {
        cause: error,
        message: `Failed to create project '${projectId}'.`,
      });
    }
  }

  async get(id: string): Promise<ProjectType> {
    this.log("Get project '%s'...", id);

    const item = await this.database.getDocument(this.collectionId, id, this.dbOptions);

    return ProjectSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    this.log("Check project '%s'...", id);

    try {
      return await this.database.hasDocument(this.collectionId, id, this.dbOptions);
    } catch {
      return false;
    }
  }

  async update(id: string, data: ProjectUpdateType): Promise<void> {
    this.log("Update project '%s'...", id);

    await this.database.updateDocument(
      this.collectionId,
      id,
      { ...data, updatedAt: new Date().toISOString() },
      this.dbOptions,
    );

    if (data.gitHubDefaultBranch) {
      try {
        this.debug("Create default-branch tag '%s'...", data.gitHubDefaultBranch);
        await new TagsModel(id).create({
          type: "branch",
          value: data.gitHubDefaultBranch,
        });
      } catch (error) {
        this.error("Error creating default branch tag:", error);
      }
    }
  }

  async delete(id: string): Promise<void> {
    this.log("Delete project '%s'...", id);

    this.debug("Delete project entry '%s' in collection", id);
    await this.database.deleteDocument(this.collectionId, id, this.dbOptions);

    this.debug("Create project-builds collection");
    await this.database.deleteCollection(
      generateDatabaseCollectionId(id, "Builds"),
      this.dbOptions,
    );

    this.debug("Delete project-tags collection");
    await this.database.deleteCollection(generateDatabaseCollectionId(id, "Tags"), this.dbOptions);

    this.debug("Create project container");
    await this.storage.deleteContainer(generateStorageContainerId(id), this.storageOptions);
  }

  async checkAuth(action: StoryBookerPermissionAction, id?: string): Promise<boolean> {
    return await checkAuthorisation({
      action,
      projectId: id ?? (this.projectId || undefined),
      resource: "project",
    });
  }

  id: BaseModel<ProjectType>["id"] = (id: string) => {
    return {
      checkAuth: (action) => checkAuthorisation({ action, projectId: id, resource: "project" }),
      delete: this.delete.bind(this, id),
      get: this.get.bind(this, id),
      has: this.has.bind(this, id),
      id,
      update: this.update.bind(this, id),
    };
  };
}
