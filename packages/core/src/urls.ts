import path from "node:path";
import type { BuildUploadVariant } from "./models/builds-schema.ts";
import type { TagVariant } from "./models/tags-schema.ts";
import { getStore } from "./utils/store.ts";
import { linkRoute, urlJoin } from "./utils/url-utils.ts";

/**
 * URL builder for the Storybooks router.
 */
export class UrlBuilder {
  #useStore: boolean;

  constructor(useStore: boolean) {
    this.#useStore = useStore;
  }

  get #baseUrl(): string {
    if (!this.#useStore) {
      return "";
    }

    return new URL(getStore().url).origin;
  }

  homepage(): string {
    return linkRoute((client) => client.index.$url(), {
      baseUrl: this.#baseUrl,
    });
  }
  openapi(): string {
    return linkRoute((client) => client.openapi.$url(), {
      baseUrl: this.#baseUrl,
    });
  }
  staticFile(filepath: string): string {
    return linkRoute((client) => client[":filepath{.+}"].$url({ param: { filepath } }), {
      baseUrl: this.#baseUrl,
    });
  }

  // accounts
  account(): string {
    return linkRoute((client) => client.account.$url(), {
      baseUrl: this.#baseUrl,
    });
  }

  login(redirect?: string): string {
    return linkRoute((client) => client.account.login.$url({ query: { redirect } }), {
      baseUrl: this.#baseUrl,
    });
  }
  logout(): string {
    return linkRoute((client) => client.account.logout.$url(), {
      baseUrl: this.#baseUrl,
    });
  }

  // projects
  projectsList(): string {
    return linkRoute((client) => client.projects.$url(), {
      baseUrl: this.#baseUrl,
    });
  }
  projectCreate(): string {
    return linkRoute((client) => client.projects.create.$url(), {
      baseUrl: this.#baseUrl,
    });
  }
  projectDetails(projectId: string): string {
    return linkRoute((client) => client.projects[":projectId"].$url({ param: { projectId } }), {
      baseUrl: this.#baseUrl,
    });
  }
  projectUpdate(projectId: string): string {
    return linkRoute(
      (client) => client.projects[":projectId"].update.$url({ param: { projectId } }),
      { baseUrl: this.#baseUrl },
    );
  }
  projectDelete(projectId: string): string {
    return linkRoute(
      (client) => client.projects[":projectId"].delete.$url({ param: { projectId } }),
      { baseUrl: this.#baseUrl },
    );
  }

  // builds
  buildsList(projectId: string): string {
    return linkRoute(
      (client) => client.projects[":projectId"].builds.$url({ param: { projectId } }),
      { baseUrl: this.#baseUrl },
    );
  }
  buildDetails(projectId: string, buildId: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].builds[":buildId"].$url({
          param: { buildId, projectId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  buildCreate(projectId: string, tagId?: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].builds.create.$url({
          param: { projectId },
          query: { tagId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  buildDelete(projectId: string, buildId: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].builds[":buildId"].delete.$url({
          param: { projectId, buildId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  buildUpdate(projectId: string, buildId: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].builds[":buildId"].update.$url({
          param: { projectId, buildId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  buildUpload(projectId: string, buildId: string, variant?: BuildUploadVariant): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].builds[":buildId"].upload.$url({
          param: { buildId, projectId },
          query: { variant },
        }),
      { baseUrl: this.#baseUrl },
    );
  }

  // tags
  tagsList(projectId: string, type?: TagVariant): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].tags.$url({
          param: { projectId },
          query: { type },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  tagCreate(projectId: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].tags.create.$url({
          param: { projectId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  tagDetails(projectId: string, tagId: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].tags[":tagId"].$url({
          param: { projectId, tagId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  tagDelete(projectId: string, tagId: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].tags[":tagId"].delete.$url({
          param: { projectId, tagId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  tagUpdate(projectId: string, tagId: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].tags[":tagId"].update.$url({
          param: { projectId, tagId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  // tagLatest: (projectId: string, tagId: string): string => {
  //   return linkRoute((client) =>
  //     client.projects[":projectId"].tags[":tagId"].latest.$url({
  //       param: { projectId, tagId },
  //     }),
  //   );
  // },

  // tags
  webhooksList(projectId: string, event?: WebhookEvent | ""): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].webhooks.$url({
          param: { projectId },
          query: { event },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  webhookCreate(projectId: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].webhooks.create.$url({
          param: { projectId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  webhookDetails(projectId: string, webhookId: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].webhooks[":webhookId"].$url({
          param: { projectId, webhookId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  webhookDelete(projectId: string, webhookId: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].webhooks[":webhookId"].delete.$url({
          param: { projectId, webhookId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  webhookUpdate(projectId: string, webhookId: string): string {
    return linkRoute(
      (client) =>
        client.projects[":projectId"].webhooks[":webhookId"].update.$url({
          param: { projectId, webhookId },
        }),
      { baseUrl: this.#baseUrl },
    );
  }

  // tasks
  taskPurge(projectId?: string): string {
    return linkRoute((client) => client.tasks.purge.$url({ query: { projectId } }), {
      baseUrl: this.#baseUrl,
    });
  }
  taskProcessZip(projectId: string, buildId: string, variant: BuildUploadVariant): string {
    return linkRoute(
      (client) =>
        client.tasks["process-zip"].$url({
          query: { projectId, buildId, variant },
        }),
      { baseUrl: this.#baseUrl },
    );
  }

  // serve
  storybookIndexHtml(projectId: string, buildId: string, storyId?: string): string {
    return linkRoute(
      (client) =>
        client._[":projectId"][":buildId"][":filepath{.+}"].$url({
          param: {
            projectId,
            buildId,
            filepath: "storybook/index.html",
          },
          query: {
            path: storyId ? `/story/${storyId}` : undefined,
          },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  storybookIFrameHtml(projectId: string, buildId: string, storyId: string): string {
    return linkRoute(
      (client) =>
        client._[":projectId"][":buildId"][":filepath{.+}"].$url({
          param: {
            projectId,
            buildId,
            filepath: "storybook/iframe.html",
          },
          query: { id: storyId, viewMode: "story" },
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  storybookDownload(projectId: string, buildId: string): string {
    return linkRoute(
      (client) =>
        client._[":projectId"][":buildId"][":filepath{.+}"].$url({
          param: {
            projectId,
            buildId,
            filepath: "storybook.zip",
          },
          query: {},
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  storybookTestReport(projectId: string, buildId: string): string {
    return linkRoute(
      (client) =>
        client._[":projectId"][":buildId"][":filepath{.+}"].$url({
          param: {
            projectId,
            buildId,
            filepath: "testReport/index.html",
          },
          query: {},
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  storybookCoverage(projectId: string, buildId: string): string {
    return linkRoute(
      (client) =>
        client._[":projectId"][":buildId"][":filepath{.+}"].$url({
          param: {
            projectId,
            buildId,
            filepath: "coverage/index.html",
          },
          query: {},
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  storybookScreenshot(projectId: string, buildId: string, ...filename: string[]): string {
    return linkRoute(
      (client) =>
        client._[":projectId"][":buildId"][":filepath{.+}"].$url({
          param: {
            projectId,
            buildId,
            filepath: path.posix.join("screenshots", ...filename),
          },
          query: {},
        }),
      { baseUrl: this.#baseUrl },
    );
  }
  storybookScreenshotsDownload(projectId: string, buildId: string): string {
    return linkRoute(
      (client) =>
        client._[":projectId"][":buildId"][":filepath{.+}"].$url({
          param: {
            projectId,
            buildId,
            filepath: "screenshots.zip",
          },
          query: {},
        }),
      { baseUrl: this.#baseUrl },
    );
  }

  // external
  // oxlint-disable-next-line class-methods-use-this
  gitHub(gitHubRepo: string, ...pathnames: string[]): string {
    const url = new URL(urlJoin(gitHubRepo, ...pathnames), "https://github.com");
    return url.toString();
  }
}

/** @private */
export const urlBuilder = new UrlBuilder(true);
/** @private */
export const urlBuilderWithoutStore = new UrlBuilder(false);
