// oxlint-disable no-nested-ternary

import { urlBuilder } from "../../urls";
import { commonT } from "../../utils/i18n";
import type { BuildType } from "../schema";

// oxlint-disable max-lines-per-function
export function BuildLinksFooter({
  build,
  projectId,
  hasUpdatePermission,
}: {
  build: BuildType;
  projectId: string;
  hasUpdatePermission: boolean;
}): JSX.Element {
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
          href={urlBuilder.storybookIndexHtml(projectId, build.sha)}
          target="_blank"
        >
          {commonT.View()} {commonT.StoryBook()}
        </a>
      ) : hasUpdatePermission ? (
        <a
          href={
            build.storybook === "uploaded"
              ? undefined
              : urlBuilder.buildUpload(projectId, build.sha, "storybook")
          }
          class="description"
        >
          {commonT.Upload()} {commonT.StoryBook()}
        </a>
      ) : null}

      {build.testReport === "ready" ? (
        <a
          href={urlBuilder.storybookTestReport(projectId, build.sha)}
          target="_blank"
        >
          {commonT.View()} Test Report
        </a>
      ) : hasUpdatePermission ? (
        <a
          href={
            build.testReport === "uploaded"
              ? undefined
              : urlBuilder.buildUpload(projectId, build.sha, "testReport")
          }
          class="description"
        >
          {commonT.Upload()} Test report
        </a>
      ) : null}

      {build.coverage === "ready" ? (
        <a
          href={urlBuilder.storybookCoverage(projectId, build.sha)}
          target="_blank"
        >
          {commonT.View()} Coverage report
        </a>
      ) : hasUpdatePermission ? (
        <a
          href={
            build.coverage === "uploaded"
              ? undefined
              : urlBuilder.buildUpload(projectId, build.sha, "coverage")
          }
          class="description"
        >
          {commonT.Upload()} Coverage report
        </a>
      ) : null}

      {build.screenshots === "ready" ? (
        <a
          href={urlBuilder.storybookScreenshotsDownload(projectId, build.sha)}
          target="_blank"
        >
          {commonT.Download()} screenshots
        </a>
      ) : hasUpdatePermission ? (
        <a
          href={
            build.screenshots === "uploaded"
              ? undefined
              : urlBuilder.buildUpload(projectId, build.sha, "screenshots")
          }
          class="description"
        >
          {commonT.Upload()} Screenshots
        </a>
      ) : null}

      {build.storybook === "uploaded" ? (
        <a
          href={urlBuilder.storybookDownload(projectId, build.sha)}
          download={`storybook-${projectId}-${build.sha}.zip`}
          target="_blank"
        >
          {commonT.Download()} {commonT.StoryBook()}
        </a>
      ) : null}
    </div>
  );
}
