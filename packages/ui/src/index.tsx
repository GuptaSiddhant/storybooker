import type { UIAdapter } from "storybooker/_internal/adapter/ui";
import pkg from "../package.json" with { type: "json" };
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, type BrandTheme } from "./styles/theme.ts";
import { DEFAULT_STATIC_DIRS } from "./utils/constants.ts";
import { withStore } from "./utils/ui-store.ts";

export type { BrandTheme };

export interface BasicUIOptions {
  /** Valid HTML string to place a logo/text in Header. */
  logo?: string;
  /** Dark mode theme */
  darkTheme?: BrandTheme;
  /** Light mode theme */
  lightTheme?: BrandTheme;
  /**
   * List of path of directories relative to root where static media is kept.
   * @default ["./public"]
   */
  staticDirs?: readonly string[];
}

export function createBasicUIAdapter(options: BasicUIOptions = {}): UIAdapter {
  const {
    darkTheme = DEFAULT_DARK_THEME,
    lightTheme = DEFAULT_LIGHT_THEME,
    staticDirs = DEFAULT_STATIC_DIRS,
    logo,
  } = options;

  return {
    metadata: {
      name: "Basic UI",
      description: "Basic server-rendered UI for StoryBooker.",
      version: pkg.version,
      logo,
      staticDirs,
      theme: { dark: darkTheme, light: lightTheme },
    },

    renderHomePage: withStore(options, async (props) => {
      const { RootPage } = await import("./pages/root-page.tsx");
      return RootPage(props);
    }),
    renderErrorPage: withStore(options, async (props) => {
      const { ErrorPage } = await import("./pages/error-page.tsx");
      return ErrorPage(props);
    }),
    renderAccountsPage: withStore(options, async (props) => {
      const { AccountPage } = await import("./pages/account-page.tsx");
      return AccountPage(props);
    }),
    handleUnhandledRoute: withStore(options, async (filepath) => {
      const { handleStaticFileRoute } = await import("./handlers/handle-static-file-route.ts");
      return await handleStaticFileRoute(filepath, { darkTheme, lightTheme, staticDirs });
    }),

    renderBuildCreatePage: withStore(options, async (props) => {
      const { BuildCreatePage } = await import("./pages/build-create-page.tsx");
      return BuildCreatePage(props);
    }),
    renderBuildDetailsPage: withStore(options, async (props) => {
      const { BuildDetailsPage } = await import("./pages/build-details-page.tsx");
      return BuildDetailsPage(props);
    }),
    renderBuildUploadPage: withStore(options, async (props) => {
      const { BuildUploadPage } = await import("./pages/build-upload-page.tsx");
      return BuildUploadPage(props);
    }),
    renderBuildsListPage: withStore(options, async (props) => {
      const { BuildsListPage } = await import("./pages/builds-list-page.tsx");
      return BuildsListPage(props);
    }),

    renderProjectCreatePage: withStore(options, async () => {
      const { ProjectCreatePage } = await import("./pages/project-create-page.tsx");
      return ProjectCreatePage();
    }),
    renderProjectDetailsPage: withStore(options, async (props) => {
      const { ProjectDetailsPage } = await import("./pages/project-details-page.tsx");
      return ProjectDetailsPage(props);
    }),
    renderProjectUpdatePage: withStore(options, async (props) => {
      const { ProjectUpdatePage } = await import("./pages/project-update-page.tsx");
      return ProjectUpdatePage(props);
    }),
    renderProjectsListPage: withStore(options, async (props) => {
      const { ProjectsListPage } = await import("./pages/projects-list-page.tsx");
      return ProjectsListPage(props);
    }),

    renderTagCreatePage: withStore(options, async (props) => {
      const { TagCreatePage } = await import("./pages/tag-create-page.tsx");
      return TagCreatePage(props);
    }),
    renderTagDetailsPage: withStore(options, async (props) => {
      const { TagDetailsPage } = await import("./pages/tag-details-page.tsx");
      return TagDetailsPage(props);
    }),
    renderTagUpdatePage: withStore(options, async (props) => {
      const { TagUpdatePage } = await import("./pages/tag-update-page.tsx");
      return TagUpdatePage(props);
    }),
    renderTagsListPage: withStore(options, async (props) => {
      const { TagsListPage } = await import("./pages/tags-list-page.tsx");
      return TagsListPage(props);
    }),
  } satisfies UIAdapter;
}
