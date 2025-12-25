import type { RenderedContent } from "@storybooker/core/adapter/~ui";
import type { ProjectType } from "@storybooker/core/types";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document.tsx";
import { ProjectForm } from "../components/project-form.tsx";
import { RawDataList } from "../components/raw-data.tsx";
import { getUIStore } from "../utils/ui-store.ts";

export function ProjectUpdatePage({ project }: { project: ProjectType }): RenderedContent {
  const title = `Update Project`;
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectsList(), label: "Projects" },
          { href: urlBuilder.projectDetails(project.id), label: project.name },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <ProjectForm project={project} actionUrl={urlBuilder.projectUpdate(project.id)} />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <RawDataList data={{ "Project ID": project.id }} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
