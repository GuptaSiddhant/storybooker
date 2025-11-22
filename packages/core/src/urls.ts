import path from "node:path";
import type { BuildUploadVariant } from "./models/builds-schema";
import type { TagVariant } from "./models/tags-schema";
import { linkRoute, urlJoin } from "./utils/url-utils";

/**
 * URL builder for the Storybooks router.
 * @private
 */
export const urlBuilder = {
  homepage(): string {
    return linkRoute((client) => client.index.$url());
  },
  openapi(): string {
    return linkRoute((client) => client.openapi.$url());
  },
  staticFile(filepath: string): string {
    return linkRoute((client) =>
      client[":filepath{.+}"].$url({ param: { filepath } }),
    );
  },

  // accounts
  account: (): string => {
    return linkRoute((client) => client.account.$url());
  },
  login: (redirect?: string): string => {
    return linkRoute((client) =>
      client.account.login.$url({ query: { redirect } }),
    );
  },
  logout: (): string => {
    return linkRoute((client) => client.account.logout.$url());
  },

  // projects
  projectsList(): string {
    return linkRoute((client) => client.projects.$url());
  },
  projectCreate(): string {
    return linkRoute((client) => client.projects.create.$url());
  },
  projectDetails(projectId: string): string {
    return linkRoute((client) =>
      client.projects[":projectId"].$url({ param: { projectId } }),
    );
  },
  projectUpdate(projectId: string): string {
    return linkRoute((client) =>
      client.projects[":projectId"].update.$url({ param: { projectId } }),
    );
  },
  projectDelete(projectId: string): string {
    return linkRoute((client) =>
      client.projects[":projectId"].delete.$url({ param: { projectId } }),
    );
  },

  // builds
  buildsList: (projectId: string): string => {
    return linkRoute((client) =>
      client.projects[":projectId"].builds.$url({ param: { projectId } }),
    );
  },
  buildDetails: (projectId: string, buildId: string): string => {
    return linkRoute((client) =>
      client.projects[":projectId"].builds[":buildId"].$url({
        param: { buildId, projectId },
      }),
    );
  },
  buildCreate: (projectId: string, tagId?: string): string => {
    return linkRoute((client) =>
      client.projects[":projectId"].builds.create.$url({
        param: { projectId },
        query: { tagId },
      }),
    );
  },
  buildDelete: (projectId: string, buildId: string): string => {
    return linkRoute((client) =>
      client.projects[":projectId"].builds[":buildId"].delete.$url({
        param: { projectId, buildId },
      }),
    );
  },
  buildUpdate: (projectId: string, buildId: string): string => {
    return linkRoute((client) =>
      client.projects[":projectId"].builds[":buildId"].update.$url({
        param: { projectId, buildId },
      }),
    );
  },
  buildUpload: (
    projectId: string,
    buildId: string,
    variant?: BuildUploadVariant,
  ): string => {
    return linkRoute((client) =>
      client.projects[":projectId"].builds[":buildId"].upload.$url({
        param: { buildId, projectId },
        query: { variant },
      }),
    );
  },

  // tags
  tagsList: (projectId: string, type?: TagVariant): string => {
    return linkRoute((client) =>
      client.projects[":projectId"].tags.$url({
        param: { projectId },
        query: { type },
      }),
    );
  },
  tagCreate: (projectId: string): string => {
    return linkRoute((client) =>
      client.projects[":projectId"].tags.create.$url({
        param: { projectId },
      }),
    );
  },
  tagDetails: (projectId: string, tagId: string): string => {
    return linkRoute((client) =>
      client.projects[":projectId"].tags[":tagId"].$url({
        param: { projectId, tagId },
      }),
    );
  },
  tagDelete: (projectId: string, tagId: string): string => {
    return linkRoute((client) =>
      client.projects[":projectId"].tags[":tagId"].delete.$url({
        param: { projectId, tagId },
      }),
    );
  },
  tagUpdate: (projectId: string, tagId: string): string => {
    return linkRoute((client) =>
      client.projects[":projectId"].tags[":tagId"].update.$url({
        param: { projectId, tagId },
      }),
    );
  },
  // tagLatest: (projectId: string, tagId: string): string => {
  //   return linkRoute((client) =>
  //     client.projects[":projectId"].tags[":tagId"].latest.$url({
  //       param: { projectId, tagId },
  //     }),
  //   );
  // },

  // tasks
  taskPurge: (projectId?: string): string => {
    return linkRoute((client) =>
      client.tasks.purge.$url({ query: { projectId } }),
    );
  },
  taskProcessZip: (
    projectId: string,
    buildId: string,
    variant: BuildUploadVariant,
  ): string => {
    return linkRoute((client) =>
      client.tasks["process-zip"].$url({
        query: { projectId, buildId, variant },
      }),
    );
  },

  // serve
  storybookIndexHtml: (
    projectId: string,
    buildId: string,
    storyId?: string,
  ): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: buildId,
          filepath: "storybook/index.html",
        },
        query: {
          path: storyId ? `/story/${storyId}` : undefined,
        },
      }),
    );
  },
  storybookIFrameHtml: (
    projectId: string,
    buildId: string,
    storyId: string,
  ): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: buildId,
          filepath: "storybook/iframe.html",
        },
        query: { id: storyId, viewMode: "story" },
      }),
    );
  },
  storybookDownload: (projectId: string, buildId: string): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: buildId,
          filepath: "storybook.zip",
        },
        query: {},
      }),
    );
  },
  storybookTestReport: (projectId: string, buildId: string): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: buildId,
          filepath: "testReport/index.html",
        },
        query: {},
      }),
    );
  },
  storybookCoverage: (projectId: string, buildId: string): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: buildId,
          filepath: "coverage/index.html",
        },
        query: {},
      }),
    );
  },
  storybookScreenshot: (
    projectId: string,
    buildId: string,
    ...filename: string[]
  ): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: buildId,
          filepath: path.posix.join("screenshots", ...filename),
        },
        query: {},
      }),
    );
  },
  storybookScreenshotsDownload: (
    projectId: string,
    buildId: string,
  ): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: buildId,
          filepath: "screenshots.zip",
        },
        query: {},
      }),
    );
  },

  // external
  gitHub: (gitHubRepo: string, ...pathnames: string[]): string => {
    const url = new URL(
      urlJoin(gitHubRepo, ...pathnames),
      "https://github.com",
    );
    return url.toString();
  },
  // oxlint-disable-next-line no-explicit-any
} satisfies Record<string, (...args: any[]) => string>;
