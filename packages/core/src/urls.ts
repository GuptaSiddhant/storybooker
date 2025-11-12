// oxlint-disable sort-keys

import { createHrefBuilder, type HrefBuilder } from "@remix-run/route-pattern";
import type { BuildUploadVariant } from "./builds/schema";
import { QUERY_PARAMS } from "./utils/constants";
import { getStore } from "./utils/store";
import { urlJoin } from "./utils/url";

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
  projects: {
    all: "projects",
    create: "projects/create",
    id: "projects/:projectId",
    update: "projects/:projectId/update",
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
  },
  serve: {
    storybook: "_/:projectId/:buildSHA/storybook/*filepath",
    coverage: "_/:projectId/:buildSHA/coverage/*filepath",
    testReport: "_/:projectId/:buildSHA/testReport/*filepath",
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
  root: (): string => {
    return href(URLS.ui.root);
  },
  login: (redirect: string): string => {
    return href(URLS.ui.login, null, { redirect });
  },
  staticFile: (filepath: string): string => {
    return href(URLS.ui.catchAll, { filepath });
  },
  allProjects: (): string => {
    return href(URLS.projects.all);
  },
  projectCreate: (): string => {
    return href(URLS.projects.create);
  },
  projectId: (projectId: string): string => {
    return href(URLS.projects.id, { projectId });
  },
  projectIdUpdate: (projectId: string): string => {
    return href(URLS.projects.update, { projectId });
  },
  allBuilds: (projectId: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "builds"),
      request.url,
    );
    return url.toString();
  },
  buildSHA: (projectId: string, sha: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "builds", sha),
      request.url,
    );
    return url.toString();
  },
  buildCreate: (projectId: string, tagSlug?: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "builds", "create"),
      request.url,
    );
    if (tagSlug) {
      url.searchParams.set(QUERY_PARAMS.tagSlug, tagSlug);
    }
    return url.toString();
  },
  buildUpload: (
    projectId: string,
    sha: string,
    variant?: BuildUploadVariant,
  ): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "builds", sha, "upload"),
      request.url,
    );
    if (variant) {
      url.searchParams.set(QUERY_PARAMS.uploadVariant, variant);
    }
    return url.toString();
  },
  allTags: (projectId: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "tags"),
      request.url,
    );
    return url.toString();
  },
  tagCreate: (projectId: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "tags", "create"),
      request.url,
    );
    return url.toString();
  },
  tagSlug: (projectId: string, tagSlug: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "tags", tagSlug),
      request.url,
    );
    return url.toString();
  },
  tagSlugUpdate: (projectId: string, tagSlug: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "tags", tagSlug, "update"),
      request.url,
    );
    return url.toString();
  },
  tagSlugLatest: (projectId: string, tagSlug: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "tags", tagSlug, "latest"),
      request.url,
    );
    return url.toString();
  },
  storybookIndexHtml: (
    projectId: string,
    sha: string,
    storyId?: string,
  ): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "_", projectId, sha, "storybook", "index.html"),
      request.url,
    );
    if (storyId) {
      url.searchParams.set("path", `/story/${storyId}`);
    }
    return url.toString();
  },
  storybookIFrameHtml: (
    projectId: string,
    sha: string,
    storyId: string,
  ): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "_", projectId, sha, "storybook", "iframe.html"),
      request.url,
    );

    url.searchParams.set("id", storyId);
    url.searchParams.set("viewMode", "story");

    return url.toString();
  },
  storybookTestReport: (projectId: string, sha: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "_", projectId, sha, "testReport", "index.html"),
      request.url,
    );
    return url.toString();
  },
  storybookCoverage: (projectId: string, sha: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "_", projectId, sha, "coverage", "index.html"),
      request.url,
    );
    return url.toString();
  },
  storybookDownload: (projectId: string, sha: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "_", projectId, sha, "storybook.zip"),
      request.url,
    );
    return url.toString();
  },
  storybookScreenshot: (
    projectId: string,
    sha: string,
    ...filename: string[]
  ): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "_", projectId, sha, "screenshots", ...filename),
      request.url,
    );
    return url.toString();
  },
  storybookScreenshotsDownload: (projectId: string, sha: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "_", projectId, sha, "screenshots.zip"),
      request.url,
    );
    return url.toString();
  },
  gitHub: (gitHubRepo: string, ...pathnames: string[]): string => {
    const url = new URL(
      urlJoin(gitHubRepo, ...pathnames),
      "https://github.com",
    );
    return url.toString();
  },
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
  // oxlint-disable-next-line no-explicit-any
} satisfies Record<string, (...args: any[]) => string>;
