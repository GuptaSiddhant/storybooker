import type { UIAdapter } from "@storybooker/core/adapter";
import pkg from "../package.json" with { type: "json" };
import { handleStaticFileRoute } from "./handlers/handle-static-file-route";
import { AccountPage } from "./pages/account-page";
import { BuildCreatePage } from "./pages/build-create-page";
import { BuildDetailsPage } from "./pages/build-details-page";
import { BuildUploadPage } from "./pages/build-upload-page";
import { BuildsListPage } from "./pages/builds-list-page";
import { ErrorPage } from "./pages/error-page";
import { ProjectCreatePage } from "./pages/project-create-page";
import { ProjectDetailsPage } from "./pages/project-details-page";
import { ProjectUpdatePage } from "./pages/project-update-page";
import { ProjectsListPage } from "./pages/projects-list-page";
import { RootPage } from "./pages/root-page";
import { TagCreatePage } from "./pages/tag-create-page";
import { TagDetailsPage } from "./pages/tag-details-page";
import { TagUpdatePage } from "./pages/tag-update-page";
import { TagsListPage } from "./pages/tags-list-pages";
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, type BrandTheme } from "./styles/theme";
import { DEFAULT_STATIC_DIRS } from "./utils/constants";
import { withStore } from "./utils/ui-store";

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
