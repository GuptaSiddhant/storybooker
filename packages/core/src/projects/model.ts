import { SERVICE_NAME } from "#constants";
import { LabelsModel } from "#labels/model";
import {
  generateProjectCollectionName,
  generateProjectContainerName,
  Model,
  type BaseModel,
  type ListOptions,
} from "#utils/shared-model";
import {
  ProjectCreateSchema,
  ProjectSchema,
  ProjectUpdateSchema,
  type ProjectType,
} from "./schema";

export class ProjectsModel extends Model<ProjectType> {
  constructor() {
    super(null, `${SERVICE_NAME}Projects`);
  }

  async list(options?: ListOptions<ProjectType>): Promise<ProjectType[]> {
    this.log("List projects...");

    try {
      this.debug("Create projects collection");
      await this.database.createCollection(this.collectionName);
    } catch (error) {
      this.error(error);
    }

    const items = await this.database.listDocuments<ProjectType>(
      this.collectionName,
      options,
    );

    return items;
  }

  async create(data: unknown): Promise<ProjectType> {
    this.log("Create project...");

    const projectData = ProjectCreateSchema.parse(data);
    const projectId = projectData.id;

    this.debug("Create project container");
    await this.storage.createContainer(generateProjectContainerName(projectId));

    this.debug("Create project collection");
    await this.database.createCollection(this.collectionName);

    this.debug("Create project-builds collection");
    await this.database.createCollection(
      generateProjectCollectionName(projectId, "Builds"),
    );

    this.debug("Create project-labels collection");
    await this.database.createCollection(
      generateProjectCollectionName(projectId, "Labels"),
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
      this.collectionName,
      project,
    );

    return project;
  }

  async get(id: string): Promise<ProjectType> {
    this.log("Get project '%s'...", id);

    const item = await this.database.getDocument(this.collectionName, id);

    return ProjectSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    return await this.get(id)
      .then(() => true)
      .catch(() => false);
  }

  async update(id: string, data: unknown): Promise<void> {
    this.log("Update project '%s'...", id);

    const project = ProjectUpdateSchema.parse(data);
    await this.database.updateDocument(this.collectionName, id, {
      ...project,
      updatedAt: new Date().toISOString(),
    });

    if (project.gitHubDefaultBranch) {
      this.debug(
        "Create default-branch label '%s'...",
        project.gitHubDefaultBranch,
      );
      await new LabelsModel(id)
        .create({
          type: "branch",
          value: project.gitHubDefaultBranch,
        })
        .catch(this.error);
    }

    return;
  }

  async delete(id: string): Promise<void> {
    this.log("Delete project '%s'...", id);

    this.debug("Delete project entry '%s' in collection", id);
    await this.database.deleteDocument(this.collectionName, id);

    this.debug("Create project-builds collection");
    await this.database.deleteCollection(
      generateProjectCollectionName(id, "Builds"),
    );

    this.debug("Delete project-labels collection");
    await this.database.deleteCollection(
      generateProjectCollectionName(id, "Labels"),
    );

    this.debug("Create project container");
    await this.storage.deleteContainer(generateProjectContainerName(id));

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
