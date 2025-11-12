// oxlint-disable no-nested-ternary
// oxlint-disable max-lines-per-function

import { Card, CardGrid } from "../../components/card";
import { href, URLS } from "../../urls";
import { toTitleCase } from "../../utils/text-utils";
import type { BuildType, BuildUploadVariant } from "../schema";

export function BuildProcessStatus({
  build,
  projectId,
  hasUpdatePermission,
}: {
  build: BuildType;
  projectId: string;
  hasUpdatePermission: boolean;
}): JSX.Element | null {
  return (
    <CardGrid style={{ padding: 0 }}>
      <BuildVariantStatus
        build={build}
        variant="storybook"
        projectId={projectId}
        hasUpdatePermission={hasUpdatePermission}
      />
      <BuildVariantStatus
        build={build}
        variant="testReport"
        projectId={projectId}
        hasUpdatePermission={hasUpdatePermission}
      />
      <BuildVariantStatus
        build={build}
        variant="coverage"
        projectId={projectId}
        hasUpdatePermission={hasUpdatePermission}
      />
      <BuildVariantStatus
        build={build}
        variant="screenshots"
        projectId={projectId}
        hasUpdatePermission={hasUpdatePermission}
      />
    </CardGrid>
  );
}

function BuildVariantStatus({
  build,
  variant,
  projectId,
  hasUpdatePermission,
}: {
  build: BuildType;
  projectId: string;
  variant: BuildUploadVariant;
  hasUpdatePermission: boolean;
}): JSX.Element | null {
  if (build[variant] !== "uploaded") {
    return null;
  }

  const url = href(URLS.admin.processZip, null, {
    project: projectId,
    sha: build.sha,
    variant,
  });
  return (
    <Card style={{ minHeight: "8rem" }}>
      <span style={{ fontSize: "0.9rem" }}>
        The {toTitleCase(variant)} is uploaded but not yet processed. It can be
        still downloaded while it is being processed.
      </span>

      {hasUpdatePermission ? (
        <form
          method="POST"
          action={url}
          hx-post={url}
          hx-disabled-elt="find button"
        >
          <button>{`Start processing ${variant}`}</button>
        </form>
      ) : null}
    </Card>
  );
}
