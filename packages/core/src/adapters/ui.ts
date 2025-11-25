import type {
  BuildStoryType,
  BuildType,
  BuildUploadVariant,
  ProjectType,
  StoryBookerUser,
  TagType,
} from "..";
import type { LoggerAdapter } from "./logger";

type RenderedContent = string | Promise<string>;

/**
 * Adapter for creating UI for StoryBooker service.
 *
 * The render methods are called asynchronously and can return promise of HTML.
 */
export interface UIAdapter {
  /**
   * A special handler that is invoked when no existing StoryBooker route is matched.
   *
   * This can be used to serve special routes and/or static files from disk.
   */
  handleUnhandledRoute: (
    filepath: string,
    options: UIAdapterOptions,
  ) => Response | Promise<Response>;

  renderHomePage(
    props: { projects: ProjectType[] },
    options: UIAdapterOptions,
  ): RenderedContent;
  renderErrorPage(props: {
    title: string;
    message: string;
    status: number;
  }): RenderedContent;
  renderAccountsPage(
    props: { children: string | undefined },
    options: UIAdapterOptions,
  ): RenderedContent;

  // Projects
  renderProjectsListPage(
    props: { projects: ProjectType[] },
    options: UIAdapterOptions,
  ): RenderedContent;
  renderProjectDetailsPage(
    props: {
      project: ProjectType;
      recentBuilds: BuildType[];
      recentTags: TagType[];
    },
    options: UIAdapterOptions,
  ): RenderedContent;
  renderProjectCreatePage(
    props: unknown,
    options: UIAdapterOptions,
  ): RenderedContent;
  renderProjectUpdatePage(
    props: { project: ProjectType },
    options: UIAdapterOptions,
  ): RenderedContent;

  // Tags
  renderTagsListPage(
    props: {
      tags: TagType[];
      project: ProjectType;
      defaultType?: string | null;
    },
    options: UIAdapterOptions,
  ): RenderedContent;
  renderTagDetailsPage(
    props: {
      tag: TagType;
      project: ProjectType;
      builds: BuildType[];
    },
    options: UIAdapterOptions,
  ): RenderedContent;
  renderTagCreatePage(
    props: { project: ProjectType },
    options: UIAdapterOptions,
  ): RenderedContent;
  renderTagUpdatePage(
    props: {
      tag: TagType;
      project: ProjectType;
    },
    options: UIAdapterOptions,
  ): RenderedContent;

  // Builds
  renderBuildsListPage(
    props: {
      builds: BuildType[];
      project: ProjectType;
    },
    options: UIAdapterOptions,
  ): RenderedContent;
  renderBuildDetailsPage(
    props: {
      build: BuildType;
      project: ProjectType;
      stories: BuildStoryType[] | null;
    },
    options: UIAdapterOptions,
  ): RenderedContent;
  renderBuildCreatePage(
    props: {
      project: ProjectType;
      tagId?: string;
    },
    options: UIAdapterOptions,
  ): RenderedContent;
  renderBuildUploadPage(
    props: {
      build: BuildType;
      project: ProjectType;
      uploadVariant?: BuildUploadVariant;
    },
    options: UIAdapterOptions,
  ): RenderedContent;
}

/** Common UI adapter options.  */
export interface UIAdapterOptions {
  isAuthEnabled: boolean;
  /** Logger */
  logger: LoggerAdapter;
  /** Logged-in user */
  user: StoryBookerUser | null | undefined;
  /** Current url */
  url: string;
  /** Current locale */
  locale: string;
}
