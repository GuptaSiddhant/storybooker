import type { ProjectType } from "../models/projects-schema";
import { href, urlBuilder, URLS } from "../urls";
import { SERVICE_NAME } from "../utils/constants";
import { getStore } from "../utils/store";
import { toTitleCase } from "../utils/text-utils";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "./components/document";
import { ErrorMessage } from "./components/error-message";
import { ProjectsGrid } from "./projects-grid";
import { commonT } from "./translations/i18n";

export interface RootPageProps {
  projects: ProjectType[];
}
export function renderRootPage({ projects }: RootPageProps): JSX.Element {
  const pageTitle = commonT.Home();

  return (
    <DocumentLayout
      title={pageTitle}
      footer={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <a href={href(URLS.ui.openapi)} target="_blank">
            OpenAPI
          </a>
          <span
            style={{
              color: "var(--color-text-secondary)",
              width: "100%",
              fontSize: "0.8rem",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "end",
            }}
          >
            {SERVICE_NAME} 2025
          </span>
        </div>
      }
    >
      <DocumentHeader
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <a href={urlBuilder.allProjects()} target="_blank">
              {commonT.All()} {commonT.Projects()}
            </a>
          </div>
        }
      >
        {pageTitle}
      </DocumentHeader>
      <DocumentMain style={{ padding: 0 }}>
        <ProjectsGrid projects={projects} />
      </DocumentMain>
      <DocumentSidebar />

      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderErrorPage({
  title,
  message,
}: {
  title: string;
  message: string;
}): JSX.Element {
  const { translation } = getStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          {
            href: "javascript:history.back()",
            label: `< ${toTitleCase(translation.dictionary.back)}`,
          },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: 0 }}>
        <ErrorMessage>{message}</ErrorMessage>
      </DocumentMain>
      <DocumentSidebar />
      <DocumentUserSection />
    </DocumentLayout>
  );
}
