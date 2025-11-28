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
import { createUIStore, uiStore } from "./utils/ui-store";

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
    handleUnhandledRoute: (filepath, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return handleStaticFileRoute(filepath, {
        darkTheme,
        lightTheme,
        staticDirs,
      });
    },

    renderErrorPage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <ErrorPage {...props} />;
    },
    renderHomePage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <RootPage {...props} />;
    },
    renderAccountsPage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <AccountPage {...props} />;
    },

    renderBuildCreatePage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <BuildCreatePage {...props} />;
    },
    renderBuildDetailsPage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return (
        <BuildDetailsPage
          {...props}
          hasDeletePermission={false}
          hasUpdatePermission={false}
        />
      );
    },
    renderBuildUploadPage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <BuildUploadPage {...props} />;
    },
    renderBuildsListPage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <BuildsListPage {...props} />;
    },

    renderProjectCreatePage: (_props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <ProjectCreatePage />;
    },
    renderProjectDetailsPage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <ProjectDetailsPage {...props} />;
    },
    renderProjectUpdatePage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <ProjectUpdatePage {...props} />;
    },
    renderProjectsListPage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <ProjectsPage {...props} />;
    },

    renderTagCreatePage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <TagCreatePage {...props} />;
    },
    renderTagDetailsPage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <TagDetailsPage {...props} />;
    },
    renderTagUpdatePage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <TagUpdatePage {...props} />;
    },
    renderTagsListPage: (props, adapterOptions) => {
      uiStore.enterWith(createUIStore(adapterOptions, options));
      return <TagsListPage {...props} defaultType={props.defaultType || ""} />;
    },
  };

  return adapter;
}
