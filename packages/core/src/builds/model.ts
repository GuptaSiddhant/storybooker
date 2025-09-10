// oxlint-disable max-lines
// oxlint-disable switch-case-braces

import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { LabelsModel } from "#labels/model";
import { ProjectsModel } from "#projects/model";
import { getStore } from "#store";
import { writeStreamToFile } from "#utils/file";
import {
  generateProjectCollectionName,
  generateProjectContainerName,
  Model,
  type BaseModel,
  type ListOptions,
} from "#utils/shared-model";
import decompress from "decompress";
import {
  BuildCreateSchema,
  BuildSchema,
  BuildUpdateSchema,
  type BuildType,
  type BuildUploadVariant,
} from "./schema";

export class BuildsModel extends Model<BuildType> {
  constructor(projectId: string) {
    super(projectId, generateProjectCollectionName(projectId, "Builds"));
  }

  async list(options?: ListOptions<BuildType>): Promise<BuildType[]> {
    if (options) {
      this.log("List builds with options (%o)...", { ...options });
    } else {
      this.log("List builds...");
    }

    const items = await this.database.listDocuments(
      this.collectionName,
      options,
    );

    return BuildSchema.array().parse(items);
  }

  async create(data: unknown): Promise<BuildType> {
    const {
      labels: parsedLabels,
      sha,
      ...rest
    } = BuildCreateSchema.parse(data);
    this.log("Create build '%s'...", sha);

    const labels = Array.isArray(parsedLabels)
      ? parsedLabels
      : parsedLabels.split(",");
    const labelSlugs = await Promise.all(
      labels.filter(Boolean).map(async (labelSlug) => {
        return await this.#updateOrCreateLabel(labelSlug, sha);
      }),
    );

    const now = new Date().toISOString();
    const build: BuildType = {
      ...rest,
      createdAt: now,
      hasCoverage: false,
      hasScreenshots: false,
      hasStorybook: false,
      hasTestReport: false,
      id: sha,
      labelSlugs: labelSlugs.filter(Boolean).join(","),
      sha,
      updatedAt: now,
    };
    await this.database.createDocument<BuildType>(this.collectionName, build);

    try {
      const projectsModel = new ProjectsModel();
      const project = await projectsModel.get(this.projectId);
      if (labels.includes(project.gitHubDefaultBranch)) {
        await projectsModel.update(this.projectId, { latestBuildSHA: sha });
      }
    } catch (error) {
      this.error(error);
    }

    return build;
  }

  async get(id: string): Promise<BuildType> {
    this.log("Get build '%s'...", id);

    const item = await this.database.getDocument(this.collectionName, id);

    return BuildSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    return await this.get(id)
      .then(() => true)
      .catch(() => false);
  }

  async update(id: string, data: Partial<BuildType>): Promise<void> {
    this.log("Update build '%s''...", id);
    const parsedData = BuildUpdateSchema.parse(data);
    await this.database.updateDocument(this.collectionName, id, {
      ...parsedData,
      updatedAt: new Date().toISOString(),
    });

    return;
  }

  async delete(buildId: string, updateLabel = true): Promise<void> {
    this.log("Delete build '%s'...", buildId);

    const build = await this.get(buildId);

    this.debug("Delete document '%s'", buildId);
    await this.database.deleteDocument(this.collectionName, buildId);

    try {
      this.debug("Delete files '%s'", buildId);
      await this.storage.deleteFiles(
        generateProjectContainerName(this.projectId),
        buildId,
      );
    } catch (error) {
      this.error("Cannot delete container:", error);
    }

    if (updateLabel) {
      this.debug("Update labels for build '%s'", buildId);
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
    }

    try {
      const projectsModel = new ProjectsModel();
      const project = await projectsModel.get(this.projectId);
      if (project.latestBuildSHA === buildId) {
        this.debug("Update project for build '%s'", buildId);
        await projectsModel.update(this.projectId, {
          latestBuildSHA: undefined,
        });
      }
    } catch (error) {
      this.error("Cannot unset build SHA from project:", error);
    }
  }

  async upload(
    buildSHA: string,
    variant: BuildUploadVariant,
    zipFile?: File,
  ): Promise<void> {
    this.log("Upload build '%s' (%s)...", buildSHA, variant);

    await this.#decompressAndUploadZip(buildSHA, variant, zipFile);

    const variantCopy = variant;
    switch (variant) {
      case "coverage":
        await this.update(buildSHA, { hasCoverage: true });
        return;
      case "screenshots":
        await this.update(buildSHA, { hasScreenshots: true });
        return;
      case "testReport":
        await this.update(buildSHA, { hasTestReport: true });
        return;
      case "storybook":
        await this.update(buildSHA, { hasStorybook: true });
        return;
      default:
        throw new Error(`Unsupported upload variant: ${variantCopy}`);
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

  // helpers
  async listByLabel(labelSlug: string): Promise<BuildType[]> {
    const builds = await this.list({
      filter: (item) => item.labelSlugs.split(",").includes(labelSlug),
    });

    return builds;
  }

  async deleteByLabel(labelSlug: string, force: boolean): Promise<void> {
    const builds = await this.listByLabel(labelSlug);
    this.log(
      "Delete builds by label: '%s' (%d, force: %s)...",
      labelSlug,
      builds.length,
      force.valueOf(),
    );

    await Promise.allSettled(
      builds.map(async (build): Promise<void> => {
        const buildLabelSlugs = build.labelSlugs.split(",");
        if (!force && buildLabelSlugs.length > 1) {
          const newSlugs = buildLabelSlugs.filter((slug) => slug !== labelSlug);
          await this.update(build.id, { labelSlugs: newSlugs.join(",") });
        } else {
          await this.delete(build.id, false);
        }
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
        this.log("A new label '%s' (%s) is being created.", value, type);
        const label = await labelsModel.create({
          latestBuildSHA: buildSHA,
          type,
          value,
        });

        return label.id;
      } catch (error) {
        this.error("Error creating slug:", error);
        return slug;
      }
    }
  }

  async #decompressAndUploadZip(
    buildSHA: string,
    variant: BuildUploadVariant = "storybook",
    zipFile?: File,
  ): Promise<void> {
    const { request } = getStore();

    this.debug("(%s-%s) Creating temp dir", buildSHA, variant);
    const dirpath = fs.mkdtempSync(
      path.join(os.tmpdir(), `storybooker-${this.projectId}-${buildSHA}-`),
    );
    const zipFilePath = path.join(dirpath, `${variant}.zip`);

    try {
      this.debug("(%s-%s) Save zip file to disk", buildSHA, variant);
      if (zipFile) {
        await writeStreamToFile(zipFilePath, zipFile.stream());
      } else {
        if (!request.body) {
          throw new Error("The body is required for upload.");
        }
        await writeStreamToFile(zipFilePath, request.body);
      }

      this.debug("(%s-%s) Decompress zip file", buildSHA, variant);
      await decompress(zipFilePath, path.join(dirpath, variant));

      this.debug("(%s-%s) Upload uncompressed dir", buildSHA, variant);
      await this.storage.uploadDir(
        generateProjectContainerName(this.projectId),
        dirpath,
        buildSHA,
      );
    } catch (error) {
      this.error(error);
    } finally {
      this.debug("(%s-%s) Cleaning up temp dir", buildSHA, variant);
      await fsp
        .rm(dirpath, { force: true, recursive: true })
        .catch((error: unknown) => {
          this.error(error);
        });
    }

    return;
  }
}
