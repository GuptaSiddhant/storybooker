import type { RenderedContent } from "storybooker/_internal/adapter/ui";
import type { BuildStoryType, BuildType, ProjectType } from "storybooker/_internal/types";
import { BuildLinksFooter } from "../components/build-links.tsx";
import { BuildProcessStatus } from "../components/build-process.tsx";
import { BuildStories } from "../components/build-stories.tsx";
import { DestructiveButton, LinkButton } from "../components/button.tsx";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document.tsx";
import { RawDataList } from "../components/raw-data.tsx";
import { confirmDelete } from "../utils/text-utils.ts";
import { getUIStore } from "../utils/ui-store.ts";

export function BuildDetailsPage({
  build,
  project,
  stories,
}: {
  build: BuildType;
  project: ProjectType;
  stories: BuildStoryType[] | null;
}): RenderedContent {
  const { urlBuilder, user } = getUIStore();
  const hasUpdatePermission = Boolean(user?.permissions["build:update"]);
  const hasDeletePermission = Boolean(user?.permissions["build:delete"]);

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
        breadcrumbs={[
          { label: project.name, href: urlBuilder.projectDetails(project.id) },
          { label: "Builds", href: urlBuilder.buildsList(project.id) },
        ]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            {shouldShowUploadButton ? (
              <LinkButton href={urlBuilder.buildUpload(project.id, build.id)}>Upload</LinkButton>
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
        {build.message ? `[${build.id.slice(0, 7)}] ${build.message}` : build.id.slice(0, 7)}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <BuildProcessStatus
          build={build}
          projectId={project.id}
          hasUpdatePermission={Boolean(hasUpdatePermission)}
        />
        <hr style={{ margin: "0.5rem 0" }} />
        <BuildStories build={build} projectId={project.id} stories={stories} />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <BuildLinksFooter
          build={build}
          projectId={project.id}
          hasUpdatePermission={Boolean(hasUpdatePermission)}
        />
        <hr style={{ margin: "1rem 0" }} />
        <RawDataList data={build} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
