// oxlint-disable max-lines-per-function

import type { BuildType, BuildUploadVariant } from "#builds/schema";
import { DestructiveButton, LinkButton } from "#components/button";
import { DocumentLayout } from "#components/document";
import { RawDataPreview } from "#components/raw-data";
import type { ProjectType } from "#projects/schema";
import { getStore } from "#store";
import { urlBuilder } from "#utils/url-builder";
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
  return (
    <DocumentLayout
      title="All Builds"
      breadcrumbs={[project.name]}
      toolbar={
        <LinkButton href={urlBuilder.buildCreate(project.id)}>
          + Create
        </LinkButton>
      }
      style={{ padding: 0 }}
    >
      <BuildsTable caption={""} project={project} builds={builds} labels={[]} />
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
    <DocumentLayout
      title={
        build.message
          ? `[${build.sha.slice(0, 7)}] ${build.message}`
          : build.sha.slice(0, 7)
      }
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
      style={{ padding: 0 }}
      sidebar={
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginTop: "1rem",
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
              href={urlBuilder.storybookScreenshotsDownload(
                projectId,
                build.sha,
              )}
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
        </div>
      }
    >
      <RawDataPreview data={build} />
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
  return (
    <DocumentLayout
      title="Create Build"
      breadcrumbs={[
        { href: urlBuilder.projectId(project.id), label: project.name },
        { href: urlBuilder.allBuilds(project.id), label: "Builds" },
      ]}
    >
      <BuildCreateForm projectId={project.id} labelSlug={labelSlug} />
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
  return (
    <DocumentLayout
      title="Upload Build files"
      breadcrumbs={[
        { href: urlBuilder.projectId(projectId), label: projectId },
        { href: urlBuilder.allBuilds(projectId), label: "Builds" },
        {
          href: urlBuilder.buildSHA(projectId, build.id),
          label: build.id.slice(0, 7),
        },
      ]}
    >
      <BuildUploadForm
        build={build}
        projectId={projectId}
        uploadVariant={uploadVariant}
      />
    </DocumentLayout>
  );
}
