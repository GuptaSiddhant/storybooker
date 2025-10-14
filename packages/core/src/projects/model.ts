import { LabelsModel } from "../labels/model";
import {
  generateDatabaseCollectionId,
  generateStorageContainerId,
  Model,
  type BaseModel,
  type ListOptions,
} from "../utils/shared-model";
import {
  ProjectCreateSchema,
  ProjectSchema,
  ProjectUpdateSchema,
  type ProjectType,
} from "./schema";

export class ProjectsModel extends Model<ProjectType> {
  constructor() {
    super(null, generateDatabaseCollectionId("Projects", ""));
  }

  async list(options: ListOptions<ProjectType> = {}): Promise<ProjectType[]> {
    this.log("List projects...");

    try {
      const items = await this.database.listDocuments<ProjectType>(
        this.collectionId,
        options,
        this.dbOptions,
      );

      return items;
    } catch (error) {
      this.error(error);
      return [];
    }
  }

  async create(data: unknown): Promise<ProjectType> {
    this.log("Create project...");

    const projectData = ProjectCreateSchema.parse(data);
    const projectId = projectData.id;

    this.debug("Create project container");
    await this.storage.createContainer(
      generateStorageContainerId(projectId),
      this.storageOptions,
    );

    this.debug("Create project collection");
    await this.database.createCollection(this.collectionId, this.dbOptions);

    this.debug("Create project-builds collection");
    await this.database.createCollection(
      generateDatabaseCollectionId(projectId, "Builds"),
      this.dbOptions,
    );

    this.debug("Create project-labels collection");
    await this.database.createCollection(
      generateDatabaseCollectionId(projectId, "Labels"),
      this.dbOptions,
    );
    this.debug(
      "Create default branch (%s) label",
      projectData.gitHubDefaultBranch,
    );
    await new LabelsModel(projectId).create({
      type: "branch",
      value: projectData.gitHubDefaultBranch,
    });

    this.debug("Create project entry '%s' in collection", projectData.id);
    const now = new Date().toISOString();
    const project: ProjectType = {
      ...projectData,
      createdAt: now,
      updatedAt: now,
    };
    await this.database.createDocument<ProjectType>(
      this.collectionId,
      project,
      this.dbOptions,
    );

    return project;
  }

  async get(id: string): Promise<ProjectType> {
    this.log("Get project '%s'...", id);

    const item = await this.database.getDocument(
      this.collectionId,
      id,
      this.dbOptions,
    );

    return ProjectSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    this.log("Check project '%s'...", id);

    return await this.database.hasDocument(
      this.collectionId,
      id,
      this.dbOptions,
    );
  }

  async update(id: string, data: unknown): Promise<void> {
    this.log("Update project '%s'...", id);

    const project = ProjectUpdateSchema.parse(data);
    await this.database.updateDocument(
      this.collectionId,
      id,
      { ...project, updatedAt: new Date().toISOString() },
      this.dbOptions,
    );

    if (project.gitHubDefaultBranch) {
      try {
        this.debug(
          "Create default-branch label '%s'...",
          project.gitHubDefaultBranch,
        );
        await new LabelsModel(id).create({
          type: "branch",
          value: project.gitHubDefaultBranch,
        });
      } catch (error) {
        this.error(error);
      }
    }

    return;
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

    this.debug("Delete project-labels collection");
    await this.database.deleteCollection(
      generateDatabaseCollectionId(id, "Labels"),
      this.dbOptions,
    );

    this.debug("Create project container");
    await this.storage.deleteContainer(
      generateStorageContainerId(id),
      this.storageOptions,
    );

    return;
  }

  id: BaseModel<ProjectType>["id"] = (id: string) => {
    return {
      delete: this.delete.bind(this, id),
      get: this.get.bind(this, id),
      has: this.has.bind(this, id),
      id,
      update: this.update.bind(this, id),
    };
  };
}
