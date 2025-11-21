import type { BuildType, BuildUploadVariant } from "../models/builds-schema";
import { urlBuilder } from "../urls";
import { toTitleCase } from "../utils/text-utils";
import { Card, CardGrid } from "./components/card";

export function BuildProcessStatus({
  build,
  projectId,
  hasUpdatePermission,
}: {
  build: BuildType;
  projectId: string;
  hasUpdatePermission: boolean;
}): JSXElement | null {
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
}): JSXElement | null {
  if (build[variant] === "ready" || build[variant] === "none") {
    return null;
  }

  const url = urlBuilder.taskProcessZip(projectId, build.sha, variant);
  const isProcessing = build[variant] === "processing";

  return (
    <Card style={{ minHeight: "8rem" }}>
      <span style={{ fontSize: "0.9rem" }}>
        The {toTitleCase(variant)} is uploaded but not yet processed. It can be
        still downloaded while it is being processed.
      </span>

      {isProcessing ? (
        <p>
          The {toTitleCase(variant)} is currently being processed. Refresh page
          to check status.
        </p>
      ) : null}

      {hasUpdatePermission ? (
        <form
          method="POST"
          action={url}
          hx-post={url}
          hx-disabled-elt="find button"
        >
          <button>
            {isProcessing
              ? `Force reprocess ${variant}`
              : `Start processing ${variant}`}
          </button>
        </form>
      ) : null}
    </Card>
  );
}
