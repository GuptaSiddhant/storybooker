// oxlint-disable sort-keys

import type { BuildUploadVariant } from "#builds/schema";
import { QUERY_PARAMS } from "./constants";
import { getStore } from "./store";
import { urlJoin } from "./url";

/**
 * URL builder for the Storybooks router.
 * @private
 */
export const urlBuilder = {
  root: (...pathnames: string[]): string => {
    const { prefix, request } = getStore();
    const url = new URL(urlJoin(prefix, ...pathnames), request.url);
    return url.toString();
  },
  staticFile: (filepath: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(urlJoin(prefix, filepath), request.url);
    return url.toString();
  },
  allProjects: (): string => {
    const { prefix, request } = getStore();
    const url = new URL(urlJoin(prefix, "projects"), request.url);
    return url.toString();
  },
  projectCreate: (): string => {
    const { prefix, request } = getStore();
    const url = new URL(urlJoin(prefix, "projects", "create"), request.url);
    return url.toString();
  },
  projectId: (projectId: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(urlJoin(prefix, "projects", projectId), request.url);
    return url.toString();
  },
  projectIdUpdate: (projectId: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "update"),
      request.url,
    );
    return url.toString();
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
  buildCreate: (projectId: string, labelSlug?: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "builds", "create"),
      request.url,
    );
    if (labelSlug) {
      url.searchParams.set(QUERY_PARAMS.labelSlug, labelSlug);
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
  allLabels: (projectId: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "labels"),
      request.url,
    );
    return url.toString();
  },
  labelCreate: (projectId: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "labels", "create"),
      request.url,
    );
    return url.toString();
  },
  labelSlug: (projectId: string, labelSlug: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "labels", labelSlug),
      request.url,
    );
    return url.toString();
  },
  labelSlugUpdate: (projectId: string, labelSlug: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "labels", labelSlug, "update"),
      request.url,
    );
    return url.toString();
  },
  labelSlugLatest: (projectId: string, labelSlug: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "labels", labelSlug, "latest"),
      request.url,
    );
    return url.toString();
  },
  storybookIndexHtml: (projectId: string, sha: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "_", projectId, sha, "storybook", "index.html"),
      request.url,
    );
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
  // oxlint-disable-next-line no-explicit-any
} satisfies Record<string, (...args: any[]) => string>;
