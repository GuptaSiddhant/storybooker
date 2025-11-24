import type {
  BuildStoryType,
  BuildType,
  BuildUploadVariant,
  ProjectType,
  TagType,
} from "..";

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
  handleUnhandledRoute: (filepath: string) => Response | Promise<Response>;

  renderHomePage(props: { projects: ProjectType[] }): RenderedContent;
  renderErrorPage(props: {
    title: string;
    message: string;
    status: number;
  }): RenderedContent;
  renderAccountsPage(props: { children: string | undefined }): RenderedContent;

  // Projects
  renderProjectsListPage(props: { projects: ProjectType[] }): RenderedContent;
  renderProjectDetailsPage(props: {
    project: ProjectType;
    recentBuilds: BuildType[];
    recentTags: TagType[];
  }): RenderedContent;
  renderProjectCreatePage(): RenderedContent;
  renderProjectUpdatePage(props: { project: ProjectType }): RenderedContent;

  // Tags
  renderTagsListPage(props: {
    tags: TagType[];
    project: ProjectType;
    defaultType?: string | null;
  }): RenderedContent;
  renderTagDetailsPage(props: {
    tag: TagType;
    project: ProjectType;
    builds: BuildType[];
  }): RenderedContent;
  renderTagCreatePage(props: { project: ProjectType }): RenderedContent;
  renderTagUpdatePage(props: {
    tag: TagType;
    project: ProjectType;
  }): RenderedContent;

  // Builds
  renderBuildsListPage(props: {
    builds: BuildType[];
    project: ProjectType;
  }): RenderedContent;
  renderBuildDetailsPage(props: {
    build: BuildType;
    project: ProjectType;
    stories: BuildStoryType[] | null;
  }): RenderedContent;
  renderBuildCreatePage(props: {
    project: ProjectType;
    tagId?: string;
  }): RenderedContent;
  renderBuildUploadPage(props: {
    build: BuildType;
    project: ProjectType;
    uploadVariant?: BuildUploadVariant;
  }): RenderedContent;
}
