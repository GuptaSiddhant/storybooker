import { SERVICE_NAME } from "@storybooker/core/constants";
import type { ProjectType } from "@storybooker/core/types";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { ProjectsGrid } from "../components/projects-grid";
import { getUIStore } from "../utils/ui-store";

export interface RootPageProps {
  projects: ProjectType[];
}

export function RootPage({ projects }: RootPageProps): JSXElement {
  const pageTitle = "Home";
  const { urlBuilder } = getUIStore();

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
          <a href={urlBuilder.openapi()} target="_blank">
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
            <a href={urlBuilder.projectsList()}>All Project</a>
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
