import type { RenderedContent } from "@storybooker/core/adapter";
import type { ProjectType } from "@storybooker/core/types";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { TagForm } from "../components/tag-form";
import { getUIStore } from "../utils/ui-store";

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
