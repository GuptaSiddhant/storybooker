// oxlint-disable switch-case-braces

import { HTTPException } from "hono/http-exception";
import type { StoryBookerPermissionAction } from "../adapters/auth";
import { handleProcessZip } from "../handlers/handle-process-zip";
import { urlBuilder } from "../urls";
import { generateDatabaseCollectionId, generateStorageContainerId } from "../utils/adapter-utils";
import { checkAuthorisation } from "../utils/auth";
import { mimes } from "../utils/mime-utils";
import { getStore } from "../utils/store";
import { Model, type BaseModel, type ListOptions } from "./~model";
import {
  BuildSchema,
  type BuildCreateType,
  type BuildStoryType,
  type BuildType,
  type BuildUpdateType,
  type BuildUploadVariant,
} from "./builds-schema";
import { ProjectsModel } from "./projects-model";
import { TagsModel } from "./tags-model";
import type { TagVariant } from "./tags-schema";

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
      { sort: "latest", ...options },
      this.dbOptions,
    );

    return BuildSchema.array().parse(items);
  }

  async create(data: BuildCreateType): Promise<BuildType> {
    const { tags: parsedTags, id, ...rest } = data;
    this.log("Create build '%s'...", id);

    try {
      if (await this.has(id)) {
        throw new HTTPException(409, {
          message: `Build '${id}' already exists.`,
        });
      }

      const tags = Array.isArray(parsedTags) ? parsedTags : parsedTags.split(",");
      const tagIds = await Promise.all(
        tags.filter(Boolean).map(async (tagId) => {
          return await this.#updateOrCreateTag(tagId, id);
        }),
      );

      const now = new Date().toISOString();
      // oxlint-disable-next-line sort-keys
      const build: BuildType = {
        ...rest,
        createdAt: now,
        coverage: "none",
        screenshots: "none",
        storybook: "none",
        testReport: "none",
        id,
        message: rest.message || "",
        tagIds: tagIds.filter(Boolean).join(","),
        updatedAt: now,
      };
      await this.database.createDocument(this.collectionId, build, this.dbOptions);

      try {
        const projectsModel = new ProjectsModel();
        const project = await projectsModel.get(this.projectId);
        if (tags.includes(project.gitHubDefaultBranch)) {
          await projectsModel.update(this.projectId, { latestBuildId: id });
        }
      } catch (error) {
        this.error(error);
      }

      return build;
    } catch (error) {
      throw new HTTPException(500, {
        cause: error,
        message: `Failed to create build '${id}'.`,
      });
    }
  }

  async get(id: string): Promise<BuildType> {
    this.log("Get build '%s'...", id);

    const item = await this.database.getDocument(this.collectionId, id, this.dbOptions);

    return BuildSchema.parse(item);
  }

  async has(id: string): Promise<boolean> {
    this.log("Check build '%s'...", id);

    try {
      return await this.database.hasDocument(this.collectionId, id, this.dbOptions);
    } catch {
      return false;
    }
  }

  async update(id: string, data: BuildUpdateType): Promise<void> {
    this.log("Update build '%s''...", id);

    await this.database.updateDocument(
      this.collectionId,
      id,
      { ...data, updatedAt: new Date().toISOString() },
      this.dbOptions,
    );

    return;
  }

  async delete(buildId: string, updateTag = true): Promise<void> {
    this.log("Delete build '%s'...", buildId);

    const build = await this.get(buildId);

    this.debug("Delete document '%s'", buildId);
    await this.database.deleteDocument(this.collectionId, buildId, this.dbOptions);

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

    if (updateTag) {
      this.debug("Update tags for build '%s'", buildId);
      const tagIds = build.tagIds?.split(",") || [];
      const tagsModel = new TagsModel(this.projectId);
      await Promise.allSettled(
        tagIds.map(async (tagId) => {
          const tag = await tagsModel.get(tagId);
          if (tag.latestBuildId === buildId) {
            await tagsModel.update(tagId, {
              buildsCount: Math.max(tag.buildsCount - 1, 0),
              latestBuildId: "",
            });
          }
        }),
      );
    }

    try {
      const projectsModel = new ProjectsModel();
      const project = await projectsModel.get(this.projectId);
      if (project.latestBuildId === buildId) {
        this.debug("Update project for build '%s'", buildId);
        await projectsModel.update(this.projectId, {
          latestBuildId: "",
        });
      }
    } catch (error) {
      this.error("Cannot unset build ID from project:", error);
    }
  }

  async upload(buildId: string, variant: BuildUploadVariant, zipFile?: File): Promise<void> {
    const { config, request } = getStore();
    this.log("Upload build '%s' (%s)...", buildId, variant);
    const variantCopy = variant; // for switch fallthrough/default

    switch (variant) {
      case "coverage":
      case "testReport":
      case "screenshots":
      case "storybook": {
        const size = await this.#uploadZipFile(buildId, variant, zipFile);
        await this.update(buildId, { [variant]: "uploaded" });

        const {
          maxInlineUploadProcessingSizeInBytes = 5 * 1024 * 1024,
          queueLargeZipFileProcessing = false,
        } = config || {};

        // Automatically process zip if feature is enabled and size is below limit
        if (size !== undefined && size <= maxInlineUploadProcessingSizeInBytes) {
          await handleProcessZip(this.projectId, buildId, variant).catch((error: unknown) => {
            this.error(error);
          });
          return;
        }

        // Otherwise queue processing task if enabled
        if (queueLargeZipFileProcessing) {
          this.log("Queue processing for build '%s' (%s)...", buildId, variant);
          const url = urlBuilder.taskProcessZip(this.projectId, buildId, variant);
          // Do not await fetch to avoid blocking
          fetch(url, { headers: request.headers, method: "POST" }).catch((error: unknown) => {
            this.error(error);
          });
        }

        return;
      }

      default:
        throw new Error(`Unsupported upload variant: ${variantCopy}`);
    }
  }

  id: BaseModel<BuildType>["id"] = (id: string) => {
    return {
      checkAuth: (action) =>
        checkAuthorisation({
          action,
          projectId: this.projectId,
          resource: "build",
        }),
      delete: this.delete.bind(this, id),
      get: this.get.bind(this, id),
      has: this.has.bind(this, id),
      id,
      update: this.update.bind(this, id),
    };
  };

  async checkAuth(action: StoryBookerPermissionAction): Promise<boolean> {
    return await checkAuthorisation({
      action,
      projectId: this.projectId,
      resource: "build",
    });
  }

  async getStories(idOrBuild: string | BuildType): Promise<BuildStoryType[] | null> {
    const { storybook, id } = typeof idOrBuild === "string" ? await this.get(idOrBuild) : idOrBuild;

    if (storybook !== "ready") {
      return null;
    }

    const { logger } = getStore();

    try {
      this.log("List stories '%s'...", id);

      const buildIndexJsonPath = `${id}/storybook/index.json`;
      const { content } = await this.storage.downloadFile(
        generateStorageContainerId(this.projectId),
        buildIndexJsonPath,
        { logger },
      );
      const data: unknown =
        typeof content === "string" ? JSON.parse(content) : await new Response(content).json();

      if (!data || typeof data !== "object" || !("entries" in data) || !data.entries) {
        return [];
      }

      return Object.values(data.entries) as BuildStoryType[];
    } catch (error) {
      this.error(error);
      return null;
    }
  }

  // helpers
  async listByTag(tagId: string): Promise<BuildType[]> {
    const builds = await this.list({
      filter: (item) => (item.tagIds ? item.tagIds.split(",").includes(tagId) : false),
    });

    return builds;
  }

  async deleteByTag(tagId: string, force: boolean): Promise<void> {
    const builds = await this.listByTag(tagId);
    this.log(
      "Delete builds by tag: '%s' (%d, force: %s)...",
      tagId,
      builds.length,
      force.valueOf(),
    );

    await Promise.allSettled(
      builds.map(async (build): Promise<void> => {
        const buildTagIds = build.tagIds?.split(",") || [];
        if (!force && buildTagIds.length > 1) {
          const newIds = buildTagIds.filter((id) => id !== tagId);
          await this.update(build.id, { tagIds: newIds.join(",") });
        } else {
          await this.delete(build.id, false);
        }
      }),
    );
  }

  async #updateOrCreateTag(tagId: string, buildId: string): Promise<string> {
    const tagsModel = new TagsModel(this.projectId);
    // Either "my-tag" or "my-tag;branch" or "my-tag;branch;My tag"
    const [id = tagId, tagType, tagValue] = tagId.split(";").map((part) => part.trim());

    try {
      const existingTag = await tagsModel.get(id);
      await tagsModel.update(id, {
        buildsCount: existingTag.buildsCount + 1,
        latestBuildId: buildId,
      });
      return id;
    } catch {
      try {
        const type = (tagType as TagVariant) || TagsModel.guessType(id);
        const value = tagValue || id;
        this.log("A new tag '%s' (%s) is being created.", value, type);
        const tag = await tagsModel.create({ latestBuildId: buildId, type, value }, true);

        return tag.id;
      } catch (error) {
        this.error("Error creating tag:", error);
        return id;
      }
    }
  }

  async #uploadZipFile(
    buildId: string,
    variant: BuildUploadVariant,
    zipFile?: File,
  ): Promise<number | undefined> {
    const { request } = getStore();
    this.debug("(%s-%s) Uploading zip file", buildId, variant);

    const content: string | Blob | ReadableStream | null = zipFile
      ? zipFile.stream()
      : request.body;

    if (!content) {
      throw new Error(`No content found for zip file.`);
    }

    await this.storage.uploadFiles(
      generateStorageContainerId(this.projectId),
      [
        {
          content,
          mimeType: mimes.zip,
          path: `${buildId}/${variant}.zip`,
        },
      ],
      this.storageOptions,
    );

    if (!zipFile) {
      const length = request.headers.get("Content-Length");
      return length ? Number(length) : undefined;
    }

    return zipFile?.size;
  }
}
