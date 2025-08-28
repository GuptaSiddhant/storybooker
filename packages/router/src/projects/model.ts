import { SERVICE_NAME } from "#constants";
import { LabelsModel } from "#labels/model";
import { getStore } from "#store";
import { parseErrorMessage } from "#utils/error";
import {
  generateProjectCollectionName,
  generateProjectContainerName,
  type BaseModel,
  type ListOptions,
} from "#utils/shared-model";
import {
  ProjectCreateSchema,
  ProjectSchema,
  ProjectUpdateSchema,
  type ProjectType,
} from "./schema";

export class ProjectsModel implements BaseModel<ProjectType> {
  #collectionName = `${SERVICE_NAME}Projects`;
  #log(id: string | undefined, ...args: unknown[]): void {
    getStore().logger.log(`[${id || "Project"}]`, ...args);
  }
  #debug(id: string | undefined, ...args: unknown[]): void {
    getStore().logger.debug?.(`[${id || "Project"}]`, ...args);
  }

  async list(options?: ListOptions<ProjectType>): Promise<ProjectType[]> {
    const { database } = getStore();
    this.#log(undefined, "List projects...");
    return await database.listDocuments<ProjectType>(
      this.#collectionName,
      options,
    );
  }

  async create(data: unknown): Promise<ProjectType> {
    const { database, storage } = getStore();
    const projectData = ProjectCreateSchema.parse(data);
    const projectId = projectData.id;

    this.#debug(undefined, "Create projects collection");
    await database.createCollection(this.#collectionName);

    this.#log(projectId, "Create project...");

    this.#debug(projectId, "Create project container");
    await storage.createContainer(generateProjectContainerName(projectId));

    this.#debug(projectId, "Create project-builds collection");
    await database.createCollection(
      generateProjectCollectionName(projectId, "Builds"),
    );

    this.#debug(projectId, "Create project-labels collection");
    await database.createCollection(
      generateProjectCollectionName(projectId, "Labels"),
    );
    await new LabelsModel(projectId).create({
      type: "branch",
      value: projectData.gitHubDefaultBranch,
    });

    this.#debug(projectId, "Create project entry in collection");
    const now = new Date().toISOString();
    const project: ProjectType = {
      ...projectData,
      createdAt: now,
      updatedAt: now,
    };
    await database.createDocument<ProjectType>(this.#collectionName, project);

    return project;
  }

  async get(id: string): Promise<ProjectType> {
    this.#log(id, "Get project...");
    const { database } = getStore();
    const item = await database.getDocument(this.#collectionName, id);

    return ProjectSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    return await this.get(id)
      .then(() => true)
      .catch(() => false);
  }

  async update(id: string, data: unknown): Promise<void> {
    this.#log(id, "Update project...");
    const { database } = getStore();
    const project = ProjectUpdateSchema.parse(data);
    await database.updateDocument(this.#collectionName, id, {
      ...project,
      updatedAt: new Date().toISOString(),
    });

    if (project.gitHubDefaultBranch) {
      await new LabelsModel(id)
        .create({
          type: "branch",
          value: project.gitHubDefaultBranch,
        })
        .catch((error) => {
          this.#log(
            id,
            "Failed to create default branch label '%s'. Error: %s",
            project.gitHubDefaultBranch,
            parseErrorMessage(error).errorMessage,
          );
        });
    }

    return;
  }

  async delete(id: string): Promise<void> {
    this.#log(id, "Delete project...");
    const { database, storage } = getStore();
    await database.deleteDocument(this.#collectionName, id);
    await database.deleteCollection(
      generateProjectCollectionName(id, "Builds"),
    );
    await database.deleteCollection(
      generateProjectCollectionName(id, "Labels"),
    );
    await storage.deleteContainer(generateProjectContainerName(id));

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
