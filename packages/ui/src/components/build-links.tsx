import type { BuildType } from "@storybooker/core/types";
import { getUIStore } from "../utils/ui-store";

export function BuildLinksFooter({
  build,
  projectId,
  hasUpdatePermission,
}: {
  build: BuildType;
  projectId: string;
  hasUpdatePermission: boolean;
}): JSXElement {
  const { urlBuilder } = getUIStore();

  return (
    <div
      style={{
        alignItems: "baseline",
        columnGap: "1rem",
        display: "flex",
        flexWrap: "wrap",
        rowGap: "0.5rem",
      }}
    >
      {build.storybook === "ready" ? (
        <a
          href={urlBuilder.storybookIndexHtml(projectId, build.id)}
          target="_blank"
        >
          View StoryBook
        </a>
      ) : hasUpdatePermission && build.storybook === "none" ? (
        <a
          href={urlBuilder.buildUpload(projectId, build.id, "storybook")}
          class="description"
        >
          Upload StoryBook
        </a>
      ) : null}

      {build.testReport === "ready" ? (
        <a
          href={urlBuilder.storybookTestReport(projectId, build.id)}
          target="_blank"
        >
          View Test Report
        </a>
      ) : hasUpdatePermission && build.testReport === "none" ? (
        <a
          href={urlBuilder.buildUpload(projectId, build.id, "testReport")}
          class="description"
        >
          Upload Test report
        </a>
      ) : null}

      {build.coverage === "ready" ? (
        <a
          href={urlBuilder.storybookCoverage(projectId, build.id)}
          target="_blank"
        >
          View Coverage report
        </a>
      ) : hasUpdatePermission && build.coverage === "none" ? (
        <a
          href={urlBuilder.buildUpload(projectId, build.id, "coverage")}
          class="description"
        >
          Upload Coverage report
        </a>
      ) : null}

      {build.screenshots === "ready" ? (
        <a
          href={urlBuilder.storybookScreenshotsDownload(projectId, build.id)}
          target="_blank"
        >
          Download screenshots
        </a>
      ) : hasUpdatePermission && build.screenshots === "none" ? (
        <a
          href={urlBuilder.buildUpload(projectId, build.id, "screenshots")}
          class="description"
        >
          Upload Screenshots
        </a>
      ) : null}

      {build.storybook === "none" ? null : (
        <a
          href={urlBuilder.storybookDownload(projectId, build.id)}
          download={`storybook-${projectId}-${build.id}.zip`}
          target="_blank"
        >
          Download StoryBook
        </a>
      )}
    </div>
  );
}
