import { urlBuilder } from "@storybooker/core/url";
import { commonT, getT } from "../translations/i18n";

export function LatestBuild({
  projectId,
  buildId,
}: {
  projectId: string;
  buildId: string | undefined;
}): JSXElement {
  if (!buildId) {
    return (
      <span class="description">{getT("messages", "no_builds_available")}</span>
    );
  }

  return (
    <div>
      <div safe style={{ fontFamily: "monospace" }}>
        {buildId.slice(0, 7)}
      </div>
      <div>
        <a href={urlBuilder.buildDetails(projectId, buildId)}>
          {commonT.Details()}
        </a>
        {" / "}
        <a href={urlBuilder.storybookIndexHtml(projectId, buildId)}>
          {commonT.StoryBook()}
        </a>
      </div>
    </div>
  );
}
