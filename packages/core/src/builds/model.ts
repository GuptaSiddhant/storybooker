// oxlint-disable max-lines
// oxlint-disable switch-case-braces

import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { LabelsModel } from "#labels/model";
import { ProjectsModel } from "#projects/model";
import { getStore } from "#store";
import { writeStreamToFile } from "#utils/file-utils";
import { getMimeType } from "#utils/mime-utils";
import {
  generateDatabaseCollectionId,
  generateStorageContainerId,
  Model,
  type BaseModel,
  type ListOptions,
} from "#utils/shared-model";
import decompress from "decompress";
import type { StoryBookerFile } from "../types";
import {
  BuildCreateSchema,
  BuildSchema,
  BuildUpdateSchema,
  type BuildType,
  type BuildUploadVariant,
} from "./schema";

export class BuildsModel extends Model<BuildType> {
  constructor(projectId: string) {
    super(projectId, generateDatabaseCollectionId(projectId, "Builds"));
  }

  async list(options: ListOptions<BuildType> = {}): Promise<BuildType[]> {
    if (options) {
      this.log("List builds with options (%o)...", { ...options });
    } else {
      this.log("List builds...");
    }

    const items = await this.database.listDocuments(
      this.collectionId,
      options,
      this.dbOptions,
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
      message: rest.message || "",
      sha,
      updatedAt: now,
    };
    await this.database.createDocument<BuildType>(
      this.collectionId,
      build,
      this.dbOptions,
    );

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

    const item = await this.database.getDocument(
      this.collectionId,
      id,
      this.dbOptions,
    );

    return BuildSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    this.log("Check build '%s'...", id);

    return await this.database.hasDocument(
      this.collectionId,
      id,
      this.dbOptions,
    );
  }

  async update(id: string, data: Partial<BuildType>): Promise<void> {
    this.log("Update build '%s''...", id);
    const parsedData = BuildUpdateSchema.parse(data);
    await this.database.updateDocument(
      this.collectionId,
      id,
      { ...parsedData, updatedAt: new Date().toISOString() },
      this.dbOptions,
    );

    return;
  }

  async delete(buildId: string, updateLabel = true): Promise<void> {
    this.log("Delete build '%s'...", buildId);

    const build = await this.get(buildId);

    this.debug("Delete document '%s'", buildId);
    await this.database.deleteDocument(
      this.collectionId,
      buildId,
      this.dbOptions,
    );

    try {
      this.debug("Delete files '%s'", buildId);
      await this.storage.deleteFiles(
        generateStorageContainerId(this.projectId),
        buildId,
        this.storageOptions,
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
            await labelsModel.update(labelSlug, {
              buildsCount: Math.max(label.buildsCount - 1, 0),
              latestBuildSHA: undefined,
            });
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
      const existingLabel = await labelsModel.get(labelSlug);
      await labelsModel.update(slug, {
        buildsCount: existingLabel.buildsCount + 1,
        latestBuildSHA: buildSHA,
      });
      return slug;
    } catch {
      try {
        const type = labelType || LabelsModel.guessType(slug);
        const value = labelValue || slug;
        this.log("A new label '%s' (%s) is being created.", value, type);
        const label = await labelsModel.create(
          {
            latestBuildSHA: buildSHA,
            type,
            value,
          },
          true,
        );

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
      await this.storage.uploadFiles(
        generateStorageContainerId(this.projectId),
        await this.#dirToFiles(dirpath, buildSHA),
        this.storageOptions,
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

  #dirToFiles = async (
    dirpath: string,
    prefix: string,
  ): Promise<StoryBookerFile[]> => {
    const { ui } = getStore();

    const allEntriesInDir = await fsp.readdir(dirpath, {
      encoding: "utf8",
      recursive: true,
      withFileTypes: true,
    });
    const allFilesInDir = allEntriesInDir
      .filter((file) => file.isFile() && !file.name.startsWith("."))
      .map((file) => path.join(file.parentPath, file.name));

    return allFilesInDir.map((filepath): StoryBookerFile => {
      const relativePath = filepath.replace(`${dirpath}/`, "");
      const content =
        ui?.streaming === false
          ? fs.readFileSync(filepath, { encoding: "binary" })
          : (Readable.toWeb(
              fs.createReadStream(filepath, { encoding: "binary" }),
            ) as ReadableStream);

      return {
        content,
        mimeType: getMimeType(filepath),
        path: path.posix.join(prefix, relativePath),
      };
    });
  };
}
