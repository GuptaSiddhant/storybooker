import { urlBuilder } from "@storybooker/core/url";

export function LatestBuild({
  projectId,
  buildId,
}: {
  projectId: string;
  buildId: string | undefined;
}): JSXElement {
  if (!buildId) {
    return <span class="description">No builds are available.</span>;
  }

  return (
    <div>
      <div safe style={{ fontFamily: "monospace" }}>
        {buildId.slice(0, 7)}
      </div>
      <div>
        <a href={urlBuilder.buildDetails(projectId, buildId)}>Details</a>
        {" / "}
        <a href={urlBuilder.storybookIndexHtml(projectId, buildId)}>
          StoryBook
        </a>
      </div>
    </div>
  );
}
