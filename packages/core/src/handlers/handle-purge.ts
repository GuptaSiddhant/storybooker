import type { LoggerAdapter } from "../adapters/logger";
import { BuildsModel } from "../models/builds-model.ts";
import { ProjectsModel } from "../models/projects-model.ts";
import type { ProjectType } from "../models/projects-schema.ts";
import { TagsModel } from "../models/tags-model.ts";
import { DEFAULT_PURGE_AFTER_DAYS, ONE_DAY_IN_MS } from "../utils/constants.ts";
import { getStore } from "../utils/store.ts";

export type HandlePurge = (
  params: { projectId?: string },
  options: { abortSignal?: AbortSignal; logger?: LoggerAdapter },
) => Promise<void>;

export const handlePurge: HandlePurge = async ({ projectId }) => {
  const projectModel = new ProjectsModel();
  if (projectId) {
    const project = await projectModel.get(projectId);
    await purgeProject(project);
  } else {
    const projects = await projectModel.list();
    const promises = projects.map((project) => purgeProject(project));
    await Promise.allSettled(promises);
  }
};

async function purgeProject(project: ProjectType): Promise<void> {
  const { locale, logger } = getStore();
  const {
    id: projectId,
    gitHubDefaultBranch,
    latestBuildId,
    purgeBuildsAfterDays = DEFAULT_PURGE_AFTER_DAYS,
  } = project;
  const expiryTime = new Date(Date.now() - purgeBuildsAfterDays * ONE_DAY_IN_MS);
  logger.log(
    `[Project: ${projectId}] Purge builds which were last modified more than ${purgeBuildsAfterDays} days ago - before ${new Date(
      expiryTime,
    ).toLocaleString(locale)}`,
  );

  const buildsModel = new BuildsModel(projectId);
  const expiredBuilds = await buildsModel.list({
    filter: (item) => item.id !== latestBuildId && new Date(item.updatedAt) < expiryTime,
  });
  for (const build of expiredBuilds) {
    // oxlint-disable-next-line no-await-in-loop
    await buildsModel.delete(build.id, true);
  }
  logger.log(`[Project: ${projectId}] Purged ${expiredBuilds.length} expired builds.`);

  const tagsModel = new TagsModel(projectId);
  const emptyTags = await tagsModel.list({
    filter: (item) => {
      if (item.type === "branch" && item.value === gitHubDefaultBranch) {
        return false;
      }
      return item.buildsCount === 0;
    },
  });
  for (const tag of emptyTags) {
    // oxlint-disable-next-line no-await-in-loop
    await tagsModel.delete(tag.id);
  }
  logger.log(`[Project: ${projectId}] Purged ${emptyTags.length} empty tags...`);
}
