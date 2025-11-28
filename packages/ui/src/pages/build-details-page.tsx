import type {
  BuildStoryType,
  BuildType,
  ProjectType,
} from "@storybooker/core/types";
import { BuildLinksFooter } from "../components/build-links";
import { BuildProcessStatus } from "../components/build-process";
import { BuildStories } from "../components/build-stories";
import { DestructiveButton, LinkButton } from "../components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { RawDataList } from "../components/raw-data";
import { confirmDelete } from "../utils/text-utils";
import { getUIStore } from "../utils/ui-store";

export function BuildDetailsPage({
  build,
  project,
  hasDeletePermission,
  hasUpdatePermission,
  stories,
}: {
  build: BuildType;
  project: ProjectType;
  hasDeletePermission: boolean;
  hasUpdatePermission: boolean;
  stories: BuildStoryType[] | null;
}): JSXElement {
  const { urlBuilder } = getUIStore();
  const shouldShowUploadButton =
    hasUpdatePermission &&
    (build.coverage === "none" ||
      build.screenshots === "none" ||
      build.storybook === "none" ||
      build.testReport === "none");

  const deleteUrl = urlBuilder.buildDelete(project.id, build.id);

  return (
    <DocumentLayout title={build.id.slice(0, 7)}>
      <DocumentHeader
        breadcrumbs={[project.id, "Builds"]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            {shouldShowUploadButton ? (
              <LinkButton href={urlBuilder.buildUpload(project.id, build.id)}>
                Upload
              </LinkButton>
            ) : null}
            {hasDeletePermission ? (
              <form
                method="post"
                action={deleteUrl}
                hx-post={deleteUrl}
                hx-confirm={confirmDelete("Build", build.id)}
              >
                <DestructiveButton>Delete</DestructiveButton>
              </form>
            ) : null}
          </div>
        }
      >
        {build.message
          ? `[${build.id.slice(0, 7)}] ${build.message}`
          : build.id.slice(0, 7)}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <BuildProcessStatus
          build={build}
          projectId={project.id}
          hasUpdatePermission={hasUpdatePermission}
        />
        <hr style={{ margin: "0.5rem 0" }} />
        <BuildStories build={build} projectId={project.id} stories={stories} />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <BuildLinksFooter
          build={build}
          projectId={project.id}
          hasUpdatePermission={hasUpdatePermission}
        />
        <hr style={{ margin: "1rem 0" }} />
        <RawDataList data={build} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
