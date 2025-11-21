// oxlint-disable sort-keys

import path from "node:path";
import { createHrefBuilder, type HrefBuilder } from "@remix-run/route-pattern";
import type { BuildUploadVariant } from "./models/builds-schema";
import type { TagVariant } from "./models/tags-schema";
import { getStore } from "./utils/store";
import { linkRoute, urlJoin } from "./utils/url-utils";

export const URLS = {
  ui: {
    root: "",
    openapi: "openapi",
    health: "health",
    account: "account",
    login: "login",
    logout: "logout",
    catchAll: "*filepath",
  },
  tasks: {
    purge: "tasks/purge",
    processZip: "tasks/process-zip",
  },
  serve: {
    all: "_/:projectId/:buildSHA/*filepath",
    storybook: "_/:projectId/:buildSHA/storybook/*filepath",
    coverage: "_/:projectId/:buildSHA/coverage/*filepath",
    testReport: "_/:projectId/:buildSHA/testReport/*filepath",
    screenshots: "_/:projectId/:buildSHA/screenshots/*filepath",
  },
} as const;

const baseHref = createHrefBuilder();

export const href: HrefBuilder = (...buildParams) => {
  const { prefix, url: base } = getStore();
  const [pattern, args, args2] = buildParams;
  // @ts-expect-error args are complex
  const value = baseHref(pattern, args, args2);
  return new URL(urlJoin(prefix, value), base).toString();
};

/**
 * URL builder for the Storybooks router.
 * @private
 */
export const urlBuilder = {
  homepage(): string {
    return linkRoute((client) => client.index.$url());
  },
  staticFile(filepath: string): string {
    return linkRoute((client) =>
      client[":filepath{.+}"].$url({ param: { filepath } }),
    );
  },

  // accounts
  login: (redirect: string): string => {
    return href(URLS.ui.login, null, { redirect });
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
  taskProcessZip: (
    projectId: string,
    buildId: string,
    variant: BuildUploadVariant,
  ): string => {
    return href(URLS.tasks.processZip, null, {
      project: projectId,
      sha: buildId,
      variant,
    });
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
