import type { ProjectType } from "@storybooker/core/types";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { ProjectForm } from "../components/project-form";
import { RawDataList } from "../components/raw-data";
import { getUIStore } from "../utils/ui-store";

export function ProjectUpdatePage({
  project,
}: {
  project: ProjectType;
}): JSXElement {
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
        <ProjectForm project={project} />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <RawDataList data={{ "Project ID": project.id }} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
