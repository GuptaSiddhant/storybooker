import type { RenderedContent } from "storybooker/adapter/~ui";
import type { ProjectType, TagType } from "storybooker/types";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document.tsx";
import { TagForm } from "../components/tag-form.tsx";
import { getUIStore } from "../utils/ui-store.ts";

export function TagUpdatePage({
  tag,
  project,
}: {
  tag: TagType;
  project: ProjectType;
}): RenderedContent {
  const title = "Update Tag";
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectDetails(project.id), label: project.name },
          { href: urlBuilder.tagsList(project.id), label: "Tags" },
          { href: urlBuilder.tagDetails(project.id, tag.id), label: tag.id },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <TagForm tag={tag} projectId={project.id} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
