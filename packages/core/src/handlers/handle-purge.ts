import { BuildsModel } from "../builds/model";
import { LabelsModel } from "../labels/model";
import { ProjectsModel } from "../projects/model";
import type { ProjectType } from "../projects/schema";
import type { LoggerService } from "../types";
import { DEFAULT_PURGE_AFTER_DAYS, ONE_DAY_IN_MS } from "../utils/constants";
import { getStore } from "../utils/store";

export type HandlePurge = (
  params: { projectId?: string },
  options: { abortSignal?: AbortSignal; logger?: LoggerService },
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
    latestBuildSHA,
    purgeBuildsAfterDays = DEFAULT_PURGE_AFTER_DAYS,
  } = project;
  const expiryTime = new Date(
    Date.now() - purgeBuildsAfterDays * ONE_DAY_IN_MS,
  );
  logger.log(
    `[Project: ${projectId}] Purge builds which were last modified more than ${purgeBuildsAfterDays} days ago - before ${new Date(
      expiryTime,
    ).toLocaleString(locale)}`,
  );

  const buildsModel = new BuildsModel(projectId);
  const expiredBuilds = await buildsModel.list({
    filter: (item) =>
      item.id !== latestBuildSHA && new Date(item.updatedAt) < expiryTime,
  });
  for (const build of expiredBuilds) {
    // oxlint-disable-next-line no-await-in-loop
    await buildsModel.delete(build.id, true);
  }
  logger.log(
    `[Project: ${projectId}] Purged ${expiredBuilds.length} expired builds.`,
  );

  const labelsModel = new LabelsModel(projectId);
  const emptyLabels = await labelsModel.list({
    filter: (item) => {
      if (item.type === "branch" && item.value === gitHubDefaultBranch) {
        return false;
      }
      return item.buildsCount === 0;
    },
  });
  for (const label of emptyLabels) {
    // oxlint-disable-next-line no-await-in-loop
    await labelsModel.delete(label.id);
  }
  logger.log(
    `[Project: ${projectId}] Purged ${emptyLabels.length} empty labels...`,
  );
}
