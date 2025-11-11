// oxlint-disable no-nested-ternary
// oxlint-disable max-lines-per-function

import type {
  BuildStoryType,
  BuildType,
  BuildUploadVariant,
} from "../../builds/schema";
import { DestructiveButton, LinkButton } from "../../components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../../components/document";
import { RawDataList } from "../../components/raw-data";
import type { ProjectType } from "../../projects/schema";
import { urlBuilder } from "../../urls";
import { commonT, getT } from "../../utils/i18n";
import { getStore } from "../../utils/store";
import { BuildCreateForm } from "./build-create-form";
import { BuildLinksFooter } from "./build-links";
import { BuildStories } from "./build-stories";
import { BuildUploadForm } from "./build-upload-form";
import { BuildsTable } from "./builds-table";

export function renderBuildsPage({
  builds,
  project,
}: {
  builds: BuildType[];
  project: ProjectType;
}): JSX.Element {
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

export function renderBuildDetailsPage({
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
}): JSX.Element {
  const { url } = getStore();
  const shouldShowUploadButton =
    hasUpdatePermission &&
    (build.coverage === "none" ||
      build.screenshots === "none" ||
      build.storybook === "none" ||
      build.testReport === "none");

  return (
    <DocumentLayout title={build.sha.slice(0, 7)}>
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
                hx-delete={url}
                hx-confirm={commonT.confirmDelete(commonT.Build(), build.sha)}
              >
                <DestructiveButton>{commonT.Delete()}</DestructiveButton>
              </form>
            ) : null}
          </div>
        }
      >
        {build.message
          ? `[${build.sha.slice(0, 7)}] ${build.message}`
          : build.sha.slice(0, 7)}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <BuildStories
          build={build}
          projectId={projectId}
          stories={stories}
          hasScreenshots={build.screenshots === "ready"}
        />
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

export function renderBuildCreatePage({
  project,
  tagSlug,
}: {
  project: ProjectType;
  tagSlug?: string;
}): JSX.Element {
  const title = `${commonT.Create()} ${commonT.Build()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectId(project.id), label: project.name },
          { href: urlBuilder.allBuilds(project.id), label: commonT.Builds() },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <BuildCreateForm projectId={project.id} tagSlug={tagSlug} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderBuildUploadPage({
  build,
  projectId,
  uploadVariant,
}: {
  build: BuildType;
  projectId: string;
  uploadVariant?: BuildUploadVariant;
}): JSX.Element {
  const title = `${commonT.Upload()} ${commonT.Build()} ${getT("dictionary", "files")}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectId(projectId), label: projectId },
          { href: urlBuilder.allBuilds(projectId), label: commonT.Builds() },
          {
            href: urlBuilder.buildSHA(projectId, build.id),
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
