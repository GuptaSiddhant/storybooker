// oxlint-disable max-lines-per-function

import type { BuildType, BuildUploadVariant } from "#builds/schema";
import { DestructiveButton, LinkButton } from "#components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "#components/document";
import { RawDataPreview } from "#components/raw-data";
import type { ProjectType } from "#projects/schema";
import { getStore } from "#store";
import { urlBuilder } from "#urls";
import { BuildCreateForm } from "./build-create-form";
import { BuildUploadForm } from "./build-upload-form";
import { BuildsTable } from "./builds-table";

export function renderBuildsPage({
  builds,
  project,
}: {
  builds: BuildType[];
  project: ProjectType;
}): JSX.Element {
  const title = "All builds";
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
        <BuildsTable
          caption={""}
          project={project}
          builds={builds}
          labels={[]}
        />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderBuildDetailsPage({
  build,
  projectId,
}: {
  build: BuildType;
  projectId: string;
}): JSX.Element {
  const { url } = getStore();

  return (
    <DocumentLayout title={build.sha.slice(0, 7)}>
      <DocumentHeader
        breadcrumbs={[projectId, "Builds"]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.buildUpload(projectId, build.id)}>
              Upload
            </LinkButton>
            <form
              hx-delete={url}
              hx-confirm="Are you sure about deleting the build?"
            >
              <DestructiveButton>Delete</DestructiveButton>
            </form>
          </div>
        }
      >
        {build.message
          ? `[${build.sha.slice(0, 7)}] ${build.message}`
          : build.sha.slice(0, 7)}
      </DocumentHeader>
      <DocumentMain>
        <RawDataPreview data={build} />
      </DocumentMain>
      <DocumentSidebar
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "1rem",
        }}
      >
        {build.hasStorybook ? (
          <a
            href={urlBuilder.storybookIndexHtml(projectId, build.sha)}
            target="_blank"
          >
            View Storybook
          </a>
        ) : (
          <a
            href={urlBuilder.buildUpload(projectId, build.sha, "storybook")}
            class="description"
          >
            Upload Storybook
          </a>
        )}
        {build.hasTestReport ? (
          <a
            href={urlBuilder.storybookTestReport(projectId, build.sha)}
            target="_blank"
          >
            View Test Report
          </a>
        ) : (
          <a
            href={urlBuilder.buildUpload(projectId, build.sha, "testReport")}
            class="description"
          >
            Upload Test report
          </a>
        )}
        {build.hasCoverage ? (
          <a
            href={urlBuilder.storybookCoverage(projectId, build.sha)}
            target="_blank"
          >
            View Coverage
          </a>
        ) : (
          <a
            href={urlBuilder.buildUpload(projectId, build.sha, "coverage")}
            class="description"
          >
            Upload Coverage report
          </a>
        )}

        {build.hasScreenshots ? (
          <a
            href={urlBuilder.storybookScreenshotsDownload(projectId, build.sha)}
            target="_blank"
          >
            Download screenshots
          </a>
        ) : (
          <a
            href={urlBuilder.buildUpload(projectId, build.sha, "screenshots")}
            class="description"
          >
            Upload Screenshots
          </a>
        )}

        {build.hasStorybook ? (
          <a
            href={urlBuilder.storybookDownload(projectId, build.sha)}
            download={`storybook-${projectId}-${build.sha}.zip`}
            target="_blank"
          >
            Download Storybook
          </a>
        ) : null}
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderBuildCreatePage({
  project,
  labelSlug,
}: {
  project: ProjectType;
  labelSlug?: string;
}): JSX.Element {
  const title = "Create Build";

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectId(project.id), label: project.name },
          { href: urlBuilder.allBuilds(project.id), label: "Builds" },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <BuildCreateForm projectId={project.id} labelSlug={labelSlug} />
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
  const title = "Upload Build files";

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectId(projectId), label: projectId },
          { href: urlBuilder.allBuilds(projectId), label: "Builds" },
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
