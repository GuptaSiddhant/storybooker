import type { UIAdapter } from "storybooker/~internal/adapter/ui";
import pkg from "../package.json" with { type: "json" };
import { handleStaticFileRoute } from "./handlers/handle-static-file-route.ts";
import { AccountPage } from "./pages/account-page.tsx";
import { BuildCreatePage } from "./pages/build-create-page.tsx";
import { BuildDetailsPage } from "./pages/build-details-page.tsx";
import { BuildUploadPage } from "./pages/build-upload-page.tsx";
import { BuildsListPage } from "./pages/builds-list-page.tsx";
import { ErrorPage } from "./pages/error-page.tsx";
import { ProjectCreatePage } from "./pages/project-create-page.tsx";
import { ProjectDetailsPage } from "./pages/project-details-page.tsx";
import { ProjectUpdatePage } from "./pages/project-update-page.tsx";
import { ProjectsListPage } from "./pages/projects-list-page.tsx";
import { RootPage } from "./pages/root-page.tsx";
import { TagCreatePage } from "./pages/tag-create-page.tsx";
import { TagDetailsPage } from "./pages/tag-details-page.tsx";
import { TagUpdatePage } from "./pages/tag-update-page.tsx";
import { TagsListPage } from "./pages/tags-list-pages.tsx";
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, type BrandTheme } from "./styles/theme.ts";
import { DEFAULT_STATIC_DIRS } from "./utils/constants.ts";
import { withStore } from "./utils/ui-store.ts";

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

    renderHomePage: withStore(options, RootPage),
    renderErrorPage: withStore(options, ErrorPage),
    renderAccountsPage: withStore(options, AccountPage),
    handleUnhandledRoute: withStore(options, (filepath) =>
      handleStaticFileRoute(filepath, {
        darkTheme,
        lightTheme,
        staticDirs,
      }),
    ),

    renderBuildCreatePage: withStore(options, BuildCreatePage),
    renderBuildDetailsPage: withStore(options, BuildDetailsPage),
    renderBuildUploadPage: withStore(options, BuildUploadPage),
    renderBuildsListPage: withStore(options, BuildsListPage),

    renderProjectCreatePage: withStore(options, ProjectCreatePage),
    renderProjectDetailsPage: withStore(options, ProjectDetailsPage),
    renderProjectUpdatePage: withStore(options, ProjectUpdatePage),
    renderProjectsListPage: withStore(options, ProjectsListPage),

    renderTagCreatePage: withStore(options, TagCreatePage),
    renderTagDetailsPage: withStore(options, TagDetailsPage),
    renderTagUpdatePage: withStore(options, TagUpdatePage),
    renderTagsListPage: withStore(options, TagsListPage),
  } satisfies UIAdapter;
}
