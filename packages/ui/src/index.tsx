import type { UIAdapter } from "@storybooker/core/adapter";
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
      return <ProjectsListPage {...props} />;
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
