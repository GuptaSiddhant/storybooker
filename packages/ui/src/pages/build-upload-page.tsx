import type { RenderedContent } from "@storybooker/core/adapter";
import type { BuildType, BuildUploadVariant, ProjectType } from "@storybooker/core/types";
import { BuildUploadForm } from "../components/build-upload-form";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { getUIStore } from "../utils/ui-store";

export function BuildUploadPage({
  build,
  project,
  uploadVariant,
}: {
  build: BuildType;
  project: ProjectType;
  uploadVariant?: BuildUploadVariant;
}): RenderedContent {
  const title = `Upload Build files`;
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectDetails(project.id), label: project.name },
          { href: urlBuilder.buildsList(project.id), label: "Builds" },
          {
            href: urlBuilder.buildDetails(project.id, build.id),
            label: build.id.slice(0, 7),
          },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <BuildUploadForm build={build} projectId={project.id} uploadVariant={uploadVariant} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
