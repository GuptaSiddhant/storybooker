// oxlint-disable sort-keys

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
    const url = new URL(urlJoin(prefix, "projects"), request.url);
    url.searchParams.set(QUERY_PARAMS.mode, QUERY_PARAMS.newResource);
    return url.toString();
  },
  projectId: (projectId: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(urlJoin(prefix, "projects", projectId), request.url);
    return url.toString();
  },
  projectIdEdit: (projectId: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(urlJoin(prefix, "projects", projectId), request.url);
    url.searchParams.set(QUERY_PARAMS.mode, QUERY_PARAMS.editResource);
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
  buildSHA: (projectId: string, sha: string, labelSlug?: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "builds", sha),
      request.url,
    );
    if (labelSlug) {
      url.searchParams.set(QUERY_PARAMS.labelSlug, labelSlug);
    }
    return url.toString();
  },
  buildUpload: (projectId: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "builds"),
      request.url,
    );
    url.searchParams.set(QUERY_PARAMS.mode, QUERY_PARAMS.newResource);
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
      urlJoin(prefix, "projects", projectId, "labels"),
      request.url,
    );
    url.searchParams.set(QUERY_PARAMS.mode, QUERY_PARAMS.newResource);
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
  labelSlugEdit: (projectId: string, labelSlug: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "projects", projectId, "labels", labelSlug),
      request.url,
    );
    url.searchParams.set(QUERY_PARAMS.mode, QUERY_PARAMS.editResource);
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
      urlJoin(prefix, "_", projectId, sha, "index.html"),
      request.url,
    );
    return url.toString();
  },
  storybookTestReport: (projectId: string, sha: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "_", projectId, sha, "report", "index.html"),
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
  storybookZip: (projectId: string, sha: string): string => {
    const { prefix, request } = getStore();
    const url = new URL(
      urlJoin(prefix, "_", projectId, sha, "storybook.zip"),
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
