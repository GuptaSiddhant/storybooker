import type {
  BuildStoryType,
  BuildType,
  BuildUploadVariant,
  ProjectType,
} from "@storybooker/core/types";
import { urlBuilder } from "@storybooker/core/url";
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
import { BuildCreateForm } from "./build-create-form";
import { BuildLinksFooter } from "./build-links";
import { BuildProcessStatus } from "./build-process";
import { BuildStories } from "./build-stories";
import { BuildUploadForm } from "./build-upload-form";
import { BuildsTable } from "./builds-table";

export function BuildsListPage({
  builds,
  project,
}: {
  builds: BuildType[];
  project: ProjectType;
}): JSXElement {
  const title = `All Builds`;
  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[project.name]}
        toolbar={
          <LinkButton href={urlBuilder.buildCreate(project.id)}>
            + Create
          </LinkButton>
        }
      >
        {title}
      </DocumentHeader>
      <DocumentMain>
        <BuildsTable caption={""} project={project} builds={builds} tags={[]} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

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

export function BuildCreatePage({
  project,
  tagId,
}: {
  project: ProjectType;
  tagId?: string;
}): JSXElement {
  const title = `$Create $Build`;

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

export function BuildUploadPage({
  build,
  project,
  uploadVariant,
}: {
  build: BuildType;
  project: ProjectType;
  uploadVariant?: BuildUploadVariant;
}): JSXElement {
  const title = `Upload Build files`;

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
        <BuildUploadForm
          build={build}
          projectId={project.id}
          uploadVariant={uploadVariant}
        />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
