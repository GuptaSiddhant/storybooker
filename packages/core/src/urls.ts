// oxlint-disable sort-keys

import path from "node:path";
import { createHrefBuilder, type HrefBuilder } from "@remix-run/route-pattern";
import type { BuildUploadVariant } from "./models/builds-schema";
import { QUERY_PARAMS } from "./utils/constants";
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
  builds: {
    all: "projects/:projectId/builds",
    create: "projects/:projectId/builds/create",
    id: "projects/:projectId/builds/:buildSHA",
    upload: "projects/:projectId/builds/:buildSHA/upload",
  },
  tags: {
    all: "projects/:projectId/tags",
    create: "projects/:projectId/tags/create",
    id: "projects/:projectId/tags/:tagSlug",
    update: "projects/:projectId/tags/:tagSlug/update",
    latest: "projects/:projectId/tags/:tagSlug/latest",
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
  projectId(projectId: string): string {
    return linkRoute((client) =>
      client.projects[":projectId"].$url({ param: { projectId } }),
    );
  },
  projectIdUpdate(projectId: string): string {
    return linkRoute((client) =>
      client.projects[":projectId"].update.$url({ param: { projectId } }),
    );
  },
  projectIdDelete(projectId: string): string {
    return linkRoute((client) =>
      client.projects[":projectId"].delete.$url({ param: { projectId } }),
    );
  },

  // builds
  allBuilds: (projectId: string): string => {
    return href(URLS.builds.all, { projectId });
  },
  buildSHA: (projectId: string, sha: string): string => {
    return href(URLS.builds.id, { buildSHA: sha, projectId });
  },
  buildCreate: (projectId: string, tagSlug?: string): string => {
    const searchParams: Record<string, string> = {};
    if (tagSlug) {
      searchParams[QUERY_PARAMS.tagSlug] = tagSlug;
    }
    return href(URLS.builds.create, { projectId }, searchParams);
  },
  buildUpload: (
    projectId: string,
    sha: string,
    variant?: BuildUploadVariant,
  ): string => {
    const searchParams: Record<string, string> = {};
    if (variant) {
      searchParams[QUERY_PARAMS.uploadVariant] = variant;
    }
    return href(URLS.builds.upload, { buildSHA: sha, projectId }, searchParams);
  },

  // tags
  allTags: (projectId: string): string => {
    return href(URLS.tags.all, { projectId });
  },
  tagCreate: (projectId: string): string => {
    return href(URLS.tags.create, { projectId });
  },
  tagSlug: (projectId: string, tagSlug: string): string => {
    return href(URLS.tags.id, { projectId, tagSlug });
  },
  tagSlugUpdate: (projectId: string, tagSlug: string): string => {
    return href(URLS.tags.update, { projectId, tagSlug });
  },
  tagSlugLatest: (projectId: string, tagSlug: string): string => {
    return href(URLS.tags.latest, { projectId, tagSlug });
  },

  // tasks
  taskProcessZip: (
    projectId: string,
    buildSHA: string,
    variant: BuildUploadVariant,
  ): string => {
    return href(URLS.tasks.processZip, null, {
      project: projectId,
      sha: buildSHA,
      variant,
    });
  },

  // serve
  storybookIndexHtml: (
    projectId: string,
    sha: string,
    storyId?: string,
  ): string => {
    const searchParams: Record<string, string> = {};
    if (storyId) {
      searchParams["path"] = `/story/${storyId}`;
    }

    return linkRoute(
      (client) =>
        client._[":projectId"][":buildSHA"][":filepath"].$url({
          param: {
            projectId,
            buildSHA: sha,
            filepath: "storybook/index.html",
          },
        }),
      searchParams,
    );
  },
  storybookIFrameHtml: (
    projectId: string,
    sha: string,
    storyId: string,
  ): string => {
    const searchParams: Record<string, string> = {};
    searchParams["viewMode"] = "story";
    searchParams["id"] = storyId;

    return linkRoute(
      (client) =>
        client._[":projectId"][":buildSHA"][":filepath"].$url({
          param: {
            projectId,
            buildSHA: sha,
            filepath: "storybook/iframe.html",
          },
        }),
      searchParams,
    );
  },
  storybookDownload: (projectId: string, sha: string): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: sha,
          filepath: "storybook.zip",
        },
      }),
    );
  },
  storybookTestReport: (projectId: string, sha: string): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: sha,
          filepath: "testReport/index.html",
        },
      }),
    );
  },
  storybookCoverage: (projectId: string, sha: string): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: sha,
          filepath: "coverage/index.html",
        },
      }),
    );
  },
  storybookScreenshot: (
    projectId: string,
    sha: string,
    ...filename: string[]
  ): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: sha,
          filepath: path.posix.join("screenshots", ...filename),
        },
      }),
    );
  },
  storybookScreenshotsDownload: (projectId: string, sha: string): string => {
    return linkRoute((client) =>
      client._[":projectId"][":buildSHA"][":filepath"].$url({
        param: {
          projectId,
          buildSHA: sha,
          filepath: "screenshots.zip",
        },
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
