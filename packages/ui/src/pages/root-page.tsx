import type { RenderedContent } from "@storybooker/core/adapter";
import { SERVICE_NAME } from "@storybooker/core/constants";
import type { ProjectType } from "@storybooker/core/types";
import { css } from "hono/css";
import { Badge } from "../components/badge";
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

export function RootPage({ projects }: RootPageProps): RenderedContent {
  const pageTitle = "Home";
  const { urlBuilder, adaptersMetadata } = getUIStore();

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
            <a href={urlBuilder.projectsList()}>All Projects</a>
          </div>
        }
      >
        {pageTitle}
      </DocumentHeader>
      <DocumentMain style={{ padding: 0 }}>
        <ProjectsGrid projects={projects} />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <details open>
          <summary style={{ fontWeight: "bold", margin: 0 }}>Adapters</summary>
          <hr />
          {Object.entries(adaptersMetadata).map(([adapterId, metadata]) => (
            <details key={adapterId} style={{ margin: "1rem 0" }}>
              <summary
                style={{ textTransform: "uppercase", fontSize: "0.8em", fontWeight: "bold" }}
              >
                {adapterId}
              </summary>
              <div
                class={css`
                  display: flex;
                  flex-direction: column;
                  gap: 0.2em;
                  margin-top: 0.5em;
                `}
              >
                <span style={{ fontSize: "0.9em" }}>{metadata.name}</span>
                {metadata.version && <Badge>{metadata.version}</Badge>}
                {metadata.description && (
                  <span style={{ margin: 0, fontSize: "0.8em" }}>{metadata.description}</span>
                )}
              </div>
            </details>
          ))}
        </details>
      </DocumentSidebar>

      <DocumentUserSection />
    </DocumentLayout>
  );
}
