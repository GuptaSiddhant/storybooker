import type { UIAdapter } from "@storybooker/core/adapter";
import { handleStaticFileRoute } from "./handle-static-file-route";
import { AccountPage } from "./pages/account-pages";
import {
  BuildCreatePage,
  BuildDetailsPage,
  BuildsListPage,
  BuildUploadPage,
} from "./pages/builds-pages";
import {
  ProjectCreatePage,
  ProjectDetailsPage,
  ProjectsPage,
  ProjectUpdatePage,
} from "./pages/projects-pages";
import { ErrorPage, RootPage } from "./pages/root-pages";
import {
  TagCreatePage,
  TagDetailsPage,
  TagsListPage,
  TagUpdatePage,
} from "./pages/tags-pages";
import {
  DEFAULT_DARK_THEME,
  DEFAULT_LIGHT_THEME,
  type BrandTheme,
} from "./styles/theme";
import { DEFAULT_STATIC_DIRS } from "./utils/constants";

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
  } = options;

  const adapter: UIAdapter = {
    handleUnhandledRoute: (filepath) =>
      handleStaticFileRoute(filepath, { darkTheme, lightTheme }, staticDirs),

    renderErrorPage: (props) => <ErrorPage {...props} />,
    renderHomePage: (props) => <RootPage {...props} />,
    renderAccountsPage: (props) => <AccountPage {...props} />,

    renderBuildCreatePage: (props) => <BuildCreatePage {...props} />,
    renderBuildDetailsPage: (props) => (
      <BuildDetailsPage
        {...props}
        hasDeletePermission={false}
        hasUpdatePermission={false}
      />
    ),
    renderBuildUploadPage: (props) => <BuildUploadPage {...props} />,
    renderBuildsListPage: (props) => <BuildsListPage {...props} />,

    renderProjectCreatePage: () => <ProjectCreatePage />,
    renderProjectDetailsPage: (props) => <ProjectDetailsPage {...props} />,
    renderProjectUpdatePage: (props) => <ProjectUpdatePage {...props} />,
    renderProjectsListPage: (props) => <ProjectsPage {...props} />,

    renderTagCreatePage: (props) => <TagCreatePage {...props} />,
    renderTagDetailsPage: (props) => <TagDetailsPage {...props} />,
    renderTagUpdatePage: (props) => <TagUpdatePage {...props} />,
    renderTagsListPage: (props) => (
      <TagsListPage {...props} defaultType={props.defaultType || ""} />
    ),
  };

  return adapter;
}
