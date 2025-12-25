import type { RenderedContent } from "storybooker/_internal/adapter/ui";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document.tsx";
import { ProjectForm } from "../components/project-form.tsx";
import { getUIStore } from "../utils/ui-store.ts";

export function ProjectCreatePage(): RenderedContent {
  const title = `Create Project`;
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader breadcrumbs={[{ href: urlBuilder.projectsList(), label: "Projects" }]}>
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <ProjectForm project={undefined} actionUrl={urlBuilder.projectCreate()} />
      </DocumentMain>
      <DocumentSidebar style={{ fontSize: "0.9em", padding: "1rem" }}>
        A project is a collection of StoryBook builds and tags. One project corresponds to one
        StoryBook instance/project.
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
