// oxlint-disable switch-case-braces

import type { StoryBookerPermissionAction } from "@storybooker/adapter/auth";
import { handleProcessZip } from "../handlers/handle-process-zip";
import { urlBuilder } from "../urls";
import {
  generateDatabaseCollectionId,
  generateStorageContainerId,
} from "../utils/adapter-utils";
import { checkAuthorisation } from "../utils/auth";
import { mimes } from "../utils/mime-utils";
import { getStore } from "../utils/store";
import { Model, type BaseModel, type ListOptions } from "./~model";
import {
  BuildCreateSchema,
  BuildSchema,
  BuildUpdateSchema,
  type BuildStoryType,
  type BuildType,
  type BuildUploadVariant,
} from "./builds-schema";
import { ProjectsModel } from "./projects-model";
import { TagsModel } from "./tags-model";

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
      {
        sort: (itemA, itemB) => {
          return (
            new Date(itemB.updatedAt).getTime() -
            new Date(itemA.updatedAt).getTime()
          );
        },
        ...options,
      },
      this.dbOptions,
    );

    return BuildSchema.array().parse(items);
  }

  async create(data: unknown): Promise<BuildType> {
    const { tags: parsedTags, sha, ...rest } = BuildCreateSchema.parse(data);
    this.log("Create build '%s'...", sha);

    const tags = Array.isArray(parsedTags) ? parsedTags : parsedTags.split(",");
    const tagSlugs = await Promise.all(
      tags.filter(Boolean).map(async (tagSlug) => {
        return await this.#updateOrCreateTag(tagSlug, sha);
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
      id: sha,
      message: rest.message || "",
      sha,
      tagSlugs: tagSlugs.filter(Boolean).join(","),
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
      if (tags.includes(project.gitHubDefaultBranch)) {
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

  async delete(buildId: string, updateTag = true): Promise<void> {
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

    if (updateTag) {
      this.debug("Update tags for build '%s'", buildId);
      const tagSlugs = build.tagSlugs.split(",");
      const tagsModel = new TagsModel(this.projectId);
      await Promise.allSettled(
        tagSlugs.map(async (tagSlug) => {
          const tag = await tagsModel.get(tagSlug);
          if (tag.latestBuildSHA === buildId) {
            await tagsModel.update(tagSlug, {
              buildsCount: Math.max(tag.buildsCount - 1, 0),
              latestBuildSHA: "",
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
          latestBuildSHA: "",
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
    const { config, request } = getStore();
    this.log("Upload build '%s' (%s)...", buildSHA, variant);
    const variantCopy = variant; // for switch fallthrough/default

    switch (variant) {
      case "coverage":
      case "testReport":
      case "screenshots":
      case "storybook": {
        const size = await this.#uploadZipFile(buildSHA, variant, zipFile);
        await this.update(buildSHA, { [variant]: "uploaded" });

        const {
          maxInlineUploadProcessingSizeInBytes = 5 * 1024 * 1024,
          queueLargeZipFileProcessing = false,
        } = config || {};

        // Automatically process zip if feature is enabled and size is below limit
        if (
          size !== undefined &&
          size <= maxInlineUploadProcessingSizeInBytes
        ) {
          await handleProcessZip(this.projectId, buildSHA, variant).catch(
            (error: unknown) => {
              this.error(error);
            },
          );
          return;
        }

        // Otherwise queue processing task if enabled
        if (queueLargeZipFileProcessing) {
          this.log(
            "Queue processing for build '%s' (%s)...",
            buildSHA,
            variant,
          );
          const url = urlBuilder.taskProcessZip(
            this.projectId,
            buildSHA,
            variant,
          );
          // Do not await fetch to avoid blocking
          fetch(url, { headers: request.headers, method: "POST" }).catch(
            (error: unknown) => {
              this.error(error);
            },
          );
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

  async getStories(
    shaOrBuild: string | BuildType,
  ): Promise<BuildStoryType[] | null> {
    const { storybook, sha } =
      typeof shaOrBuild === "string" ? await this.get(shaOrBuild) : shaOrBuild;

    if (storybook !== "ready") {
      return null;
    }

    const { logger } = getStore();

    try {
      this.log("List stories '%s'...", sha);

      const buildIndexJsonPath = `${sha}/storybook/index.json`;
      const { content } = await this.storage.downloadFile(
        generateStorageContainerId(this.projectId),
        buildIndexJsonPath,
        { logger },
      );
      const data: unknown =
        typeof content === "string"
          ? JSON.parse(content)
          : await new Response(content).json();

      if (
        !data ||
        typeof data !== "object" ||
        !("entries" in data) ||
        !data.entries
      ) {
        return [];
      }

      return Object.values(data.entries) as BuildStoryType[];
    } catch (error) {
      this.error(error);
      return null;
    }
  }

  // helpers
  async listByTag(tagSlug: string): Promise<BuildType[]> {
    const builds = await this.list({
      filter: (item) => item.tagSlugs.split(",").includes(tagSlug),
    });

    return builds;
  }

  async deleteByTag(tagSlug: string, force: boolean): Promise<void> {
    const builds = await this.listByTag(tagSlug);
    this.log(
      "Delete builds by tag: '%s' (%d, force: %s)...",
      tagSlug,
      builds.length,
      force.valueOf(),
    );

    await Promise.allSettled(
      builds.map(async (build): Promise<void> => {
        const buildTagSlugs = build.tagSlugs.split(",");
        if (!force && buildTagSlugs.length > 1) {
          const newSlugs = buildTagSlugs.filter((slug) => slug !== tagSlug);
          await this.update(build.id, { tagSlugs: newSlugs.join(",") });
        } else {
          await this.delete(build.id, false);
        }
      }),
    );
  }

  async #updateOrCreateTag(tagSlug: string, buildSHA: string): Promise<string> {
    const tagsModel = new TagsModel(this.projectId);
    // Either "my-tag" or "my-tag;branch" or "my-tag;branch;My tag"
    const [slug = tagSlug, tagType, tagValue] = tagSlug
      .split(";")
      .map((part) => part.trim());

    try {
      const existingTag = await tagsModel.get(tagSlug);
      await tagsModel.update(slug, {
        buildsCount: existingTag.buildsCount + 1,
        latestBuildSHA: buildSHA,
      });
      return slug;
    } catch {
      try {
        const type = tagType || TagsModel.guessType(slug);
        const value = tagValue || slug;
        this.log("A new tag '%s' (%s) is being created.", value, type);
        const tag = await tagsModel.create(
          { latestBuildSHA: buildSHA, type, value },
          true,
        );

        return tag.id;
      } catch (error) {
        this.error("Error creating tag slug:", error);
        return slug;
      }
    }
  }

  async #uploadZipFile(
    buildSHA: string,
    variant: BuildUploadVariant,
    zipFile?: File,
  ): Promise<number | undefined> {
    const { request } = getStore();
    this.debug("(%s-%s) Uploading zip file", buildSHA, variant);

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
          path: `${buildSHA}/${variant}.zip`,
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
