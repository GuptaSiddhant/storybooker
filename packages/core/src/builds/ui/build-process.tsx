// oxlint-disable max-lines-per-function

import { href, URLS } from "../../urls";
import type { BuildType } from "../schema";

export function BuildProcessStatus({
  build,
  projectId,
  hasUpdatePermission,
}: {
  build: BuildType;
  projectId: string;
  hasUpdatePermission: boolean;
}): JSX.Element | null {
  if (build.storybook === "none") {
    return (
      <p style={{ margin: "1rem" }}>The build does not have a StoryBook yet.</p>
    );
  }

  if (build.storybook === "uploaded") {
    return (
      <div>
        <p style={{ margin: "1rem" }}>
          The StoryBook is uploaded but not yet processed. It can be still
          downloaded while it is being processed.
        </p>

        {hasUpdatePermission ? (
          <form
            hx-post={href(URLS.admin.processZip, null, {
              project: projectId,
              sha: build.sha,
              variant: "storybook",
            })}
          >
            <button>{"Start processing storybook"}</button>
          </form>
        ) : null}
      </div>
    );
  }

  if (build.testReport === "uploaded") {
    return (
      <div>
        <p style={{ margin: "1rem" }}>
          The Test Report is uploaded but not yet processed. It can be still
          downloaded while it is being processed.
        </p>

        {hasUpdatePermission ? (
          <form
            hx-post={href(URLS.admin.processZip, null, {
              project: projectId,
              sha: build.sha,
              variant: "testReport",
            })}
          >
            <button>{"Start processing test report"}</button>
          </form>
        ) : null}
      </div>
    );
  }

  if (build.coverage === "uploaded") {
    return (
      <div>
        <p style={{ margin: "1rem" }}>
          The Coverage report is uploaded but not yet processed. It can be still
          downloaded while it is being processed.
        </p>

        {hasUpdatePermission ? (
          <form
            hx-post={href(URLS.admin.processZip, null, {
              project: projectId,
              sha: build.sha,
              variant: "coverage",
            })}
          >
            <button>{"Start processing coverage report"}</button>
          </form>
        ) : null}
      </div>
    );
  }

  if (build.screenshots === "uploaded") {
    return (
      <div>
        <p style={{ margin: "1rem" }}>
          The Screenshots report is uploaded but not yet processed. It can be
          still downloaded while it is being processed.
        </p>

        {hasUpdatePermission ? (
          <form
            hx-post={href(URLS.admin.processZip, null, {
              project: projectId,
              sha: build.sha,
              variant: "screenshots",
            })}
          >
            <button>{"Start processing screenshots"}</button>
          </form>
        ) : null}
      </div>
    );
  }

  return null;
}
