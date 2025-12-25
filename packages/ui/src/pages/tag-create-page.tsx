import type { RenderedContent } from "storybooker/~internal/adapter/ui";
import type { ProjectType } from "storybooker/~internal/types";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document.tsx";
import { TagForm } from "../components/tag-form.tsx";
import { getUIStore } from "../utils/ui-store.ts";

export function TagCreatePage({ project }: { project: ProjectType }): RenderedContent {
  const title = "Create Tag";
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectDetails(project.id), label: project.name },
          { href: urlBuilder.tagsList(project.id), label: "Tags" },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <TagForm tag={undefined} projectId={project.id} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
