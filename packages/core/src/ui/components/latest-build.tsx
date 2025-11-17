import { urlBuilder } from "../../urls";
import { commonT, getT } from "../../utils/i18n";

export function LatestBuild({
  projectId,
  sha,
}: {
  projectId: string;
  sha: string | undefined;
}): JSX.Element {
  if (!sha) {
    return (
      <span class="description">{getT("messages", "no_builds_available")}</span>
    );
  }

  return (
    <div>
      <div safe style={{ fontFamily: "monospace" }}>
        {sha.slice(0, 7)}
      </div>
      <div>
        <a href={urlBuilder.buildSHA(projectId, sha)}>{commonT.Details()}</a>
        {" / "}
        <a href={urlBuilder.storybookIndexHtml(projectId, sha)}>
          {commonT.StoryBook()}
        </a>
      </div>
    </div>
  );
}
