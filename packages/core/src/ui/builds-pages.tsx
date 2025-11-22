import type {
  BuildStoryType,
  BuildType,
  BuildUploadVariant,
} from "../models/builds-schema";
import type { ProjectType } from "../models/projects-schema";
import { urlBuilder } from "../urls";
import { BuildCreateForm } from "./build-create-form";
import { BuildLinksFooter } from "./build-links";
import { BuildProcessStatus } from "./build-process";
import { BuildStories } from "./build-stories";
import { BuildUploadForm } from "./build-upload-form";
import { BuildsTable } from "./builds-table";
import { DestructiveButton, LinkButton } from "./components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "./components/document";
import { RawDataList } from "./components/raw-data";
import { commonT, getT } from "./translations/i18n";

export function BuildsListPage({
  builds,
  project,
}: {
  builds: BuildType[];
  project: ProjectType;
}): JSXElement {
  const title = `${commonT.All()} ${commonT.Builds()}`;
  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[project.name]}
        toolbar={
          <LinkButton href={urlBuilder.buildCreate(project.id)}>
            + {commonT.Create()}
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
  projectId,
  hasDeletePermission,
  hasUpdatePermission,
  stories,
}: {
  build: BuildType;
  projectId: string;
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

  const deleteUrl = urlBuilder.buildDelete(projectId, build.id);

  return (
    <DocumentLayout title={build.id.slice(0, 7)}>
      <DocumentHeader
        breadcrumbs={[projectId, commonT.Builds()]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            {shouldShowUploadButton ? (
              <LinkButton href={urlBuilder.buildUpload(projectId, build.id)}>
                {commonT.Upload()}
              </LinkButton>
            ) : null}
            {hasDeletePermission ? (
              <form
                method="post"
                action={deleteUrl}
                hx-post={deleteUrl}
                hx-confirm={commonT.confirmDelete(commonT.Build(), build.id)}
              >
                <DestructiveButton>{commonT.Delete()}</DestructiveButton>
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
          projectId={projectId}
          hasUpdatePermission={hasUpdatePermission}
        />
        <hr style={{ margin: "0.5rem 0" }} />
        <BuildStories build={build} projectId={projectId} stories={stories} />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <BuildLinksFooter
          build={build}
          projectId={projectId}
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
  const title = `${commonT.Create()} ${commonT.Build()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectDetails(project.id), label: project.name },
          { href: urlBuilder.buildsList(project.id), label: commonT.Builds() },
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
  projectId,
  uploadVariant,
}: {
  build: BuildType;
  projectId: string;
  uploadVariant?: BuildUploadVariant;
}): JSXElement {
  const title = `${commonT.Upload()} ${commonT.Build()} ${getT("dictionary", "files")}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectDetails(projectId), label: projectId },
          { href: urlBuilder.buildsList(projectId), label: commonT.Builds() },
          {
            href: urlBuilder.buildDetails(projectId, build.id),
            label: build.id.slice(0, 7),
          },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <BuildUploadForm
          build={build}
          projectId={projectId}
          uploadVariant={uploadVariant}
        />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
