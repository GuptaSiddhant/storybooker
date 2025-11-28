import type { ProjectType } from "@storybooker/core/types";
import { BuildCreateForm } from "../components/build-create-form";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { getUIStore } from "../utils/ui-store";

export function BuildCreatePage({
  project,
  tagId,
}: {
  project: ProjectType;
  tagId?: string;
}): JSXElement {
  const title = `Create Build`;
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectDetails(project.id), label: project.name },
          { href: urlBuilder.buildsList(project.id), label: "Builds" },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <BuildCreateForm projectId={project.id} tagId={tagId} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
