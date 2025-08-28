import { LabelsModel } from "#labels/model";
import { ProjectsModel } from "#projects/model";
import { getStore } from "#store";
import {
  generateProjectCollectionName,
  generateStorageContainerName,
  type BaseModel,
  type ListOptions,
} from "#utils/shared-model";
import {
  BuildCreateSchema,
  BuildSchema,
  BuildUpdateSchema,
  type BuildType,
} from "./schema";

export class BuildsModel implements BaseModel<BuildType> {
  projectId: string;
  #collectionName: string;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.#collectionName = generateProjectCollectionName(projectId, "Builds");
  }

  #log(...args: unknown[]): void {
    getStore().logger.log(`[${this.projectId}]`, ...args);
  }
  #error(...args: unknown[]): void {
    getStore().logger.error(`[${this.projectId}]`, ...args);
  }

  async list(options?: ListOptions<BuildType>): Promise<BuildType[]> {
    if (options) {
      this.#log("List builds with options (%o)...", options);
    } else {
      this.#log("List builds...");
    }

    const { database } = getStore();
    const items = await database.listDocuments(this.#collectionName, options);
    const builds = BuildSchema.array().parse(items);

    const groupBySHA = Object.groupBy(builds, (build) => build.id);
    const groupedBuilds: BuildType[] = [];

    for (const group of Object.values(groupBySHA)) {
      if (group?.[0]) {
        group[0].labelSlugs = group.map((build) => build.labelSlugs).join(",");
      }
    }

    return groupedBuilds;
  }

  async create(data: unknown): Promise<BuildType> {
    const { labels, id, ...rest } = BuildCreateSchema.parse(data);
    this.#log("Create build '%s'...", id);
    const { database } = getStore();

    const labelSlugs = await Promise.all(
      labels
        .filter(Boolean)
        .map((labelSlug) => this.#updateOrCreateLabel(labelSlug, id)),
    );

    const now = new Date().toISOString();
    const build: BuildType = {
      ...rest,
      createdAt: now,
      hasCoverage: false,
      hasScreenshots: false,
      hasStorybook: false,
      hasTestReport: false,
      id,
      labelSlugs: labelSlugs.filter(Boolean).join(","),
      updatedAt: now,
    };
    await database.createDocument<BuildType>(this.#collectionName, build);

    try {
      const projectsModel = new ProjectsModel();
      const project = await projectsModel.get(this.projectId);
      if (labels.includes(project.gitHubDefaultBranch)) {
        projectsModel.update(this.projectId, { latestBuildSHA: id });
      }
    } catch (error) {
      this.#error(error);
    }

    return build;
  }

  async get(id: string): Promise<BuildType> {
    this.#log("Get build '%s'...", id);
    const { database } = getStore();

    const item = await database.getDocument(this.#collectionName, id);

    return BuildSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    return await this.get(id)
      .then(() => true)
      .catch(() => false);
  }

  async update(id: string, data: Partial<BuildType>): Promise<void> {
    this.#log("Update build '%s''...", id);
    const parsedData = BuildUpdateSchema.parse(data);
    const { database } = getStore();
    await database.updateDocument(this.#collectionName, id, {
      ...parsedData,
      updatedAt: new Date().toISOString(),
    });

    return;
  }

  async delete(buildId: string): Promise<void> {
    this.#log("Delete build '%s'...", buildId);
    const { database, storage } = getStore();
    const build = await this.get(buildId);

    // Delete entry and files
    await database.deleteDocument(this.#collectionName, buildId);
    await storage.deleteFiles(
      generateStorageContainerName(this.projectId),
      buildId,
    );

    // Delete ref from labels
    const labelSlugs = build.labelSlugs.split(",");
    const labelsModel = new LabelsModel(this.projectId);
    await Promise.allSettled(
      labelSlugs.map(async (labelSlug) => {
        const label = await labelsModel.get(labelSlug);
        if (label.latestBuildSHA === buildId) {
          await labelsModel.update(labelSlug, { latestBuildSHA: undefined });
        }
      }),
    );

    // Delete ref from project
    try {
      const projectsModel = new ProjectsModel();
      const project = await projectsModel.get(this.projectId);
      if (project.latestBuildSHA === buildId) {
        projectsModel.update(this.projectId, { latestBuildSHA: undefined });
      }
    } catch (error) {
      this.#error("Error unsetting build SHA from project:", error);
    }
  }

  // helpers
  async listByLabel(labelSlug: string): Promise<BuildType[]> {
    return await this.list({
      filter: (item) => item.labelSlugs.split(",").includes(labelSlug),
    });
  }

  async deleteByLabel(labelSlug: string): Promise<void> {
    const builds = await this.listByLabel(labelSlug);
    this.#log("Delete builds by label: '%s' (%d)...", labelSlug, builds.length);

    await Promise.allSettled(
      builds.map(async (build): Promise<void> => {
        await this.delete(build.id);
      }),
    );
  }

  async #updateOrCreateLabel(
    labelSlug: string,
    buildSHA: string,
  ): Promise<string> {
    const labelsModel = new LabelsModel(this.projectId);
    // Either "my-label" or "my-label;branch" or "my-label;branch;My label"
    const [slug = labelSlug, labelType, labelValue] = labelSlug
      .split(";")
      .map((part) => part.trim());

    try {
      await labelsModel.update(slug, { latestBuildSHA: buildSHA });
      return slug;
    } catch {
      try {
        const type = labelType || LabelsModel.guessType(slug);
        const value = labelValue || slug;
        this.#log("A new label '$s' (%s) is being created.", value, type);
        await labelsModel.create({ latestBuildSHA: buildSHA, type, value });
        return slug;
      } catch (error) {
        this.#error("Error creating slug:", error);
        return slug;
      }
    }
  }

  id: BaseModel<BuildType>["id"] = (id: string) => {
    return {
      delete: this.delete.bind(this, id),
      get: this.get.bind(this, id),
      has: this.has.bind(this, id),
      id,
      update: this.update.bind(this, id),
    };
  };
}
