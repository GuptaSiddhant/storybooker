// oxlint-disable max-lines-per-function

import { Card, CardRow } from "../../components/card";
import { urlBuilder } from "../../urls";
import type { BuildStoryType, BuildType } from "../schema";

export function BuildStories({
  build,
  projectId,
  stories,
}: {
  projectId: string;
  build: BuildType;
  stories: BuildStoryType[] | null;
}): JSX.Element {
  const { hasStorybook, sha } = build;

  if (!hasStorybook || !stories) {
    return (
      <p style={{ margin: "1rem" }}>The build does not have a StoryBook yet.</p>
    );
  }

  const groups = Object.groupBy(stories, (story) => story.title);

  return (
    <>
      {Object.entries(groups).map(([key, group]) => {
        const groupedStories = group?.filter((story) => story.type === "story");

        if (!groupedStories || groupedStories.length === 0) {
          return null;
        }

        const groupTitle = key.replaceAll("/", " / ");

        return (
          <details open>
            <summary style={{ fontWeight: "bold" }}>{groupTitle}</summary>

            <CardRow>
              {groupedStories.map((story) => (
                <StoryCard projectId={projectId} sha={sha} story={story} />
              ))}
            </CardRow>
          </details>
        );
      })}
    </>
  );
}

function StoryCard({
  projectId,
  sha,
  story,
}: {
  projectId: string;
  sha: string;
  story: BuildStoryType;
}): JSX.Element {
  const storybookHref = urlBuilder.storybookIndexHtml(projectId, sha, story.id);
  const storybookIframeHref = urlBuilder.storybookIFrameHtml(
    projectId,
    sha,
    story.id,
  );

  const screenshotSrc = urlBuilder.storybookScreenshot(
    projectId,
    sha,
    story.importPath,
    `${story.name}.png`,
  );

  return (
    <Card style={{ gap: 0, height: "200px", padding: 0, width: "320px" }}>
      <header
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "space-between",
          padding: "0.25rem 0.5rem",
        }}
      >
        <a href={storybookHref} target="_blank">
          {story.name}
        </a>
        <a
          title="Iframe mode"
          href={storybookIframeHref}
          target="_blank"
          style={{
            borderLeft: "1px solid var(--color-border)",
            paddingLeft: "0.5rem",
          }}
        >
          {"&#x2192;"}
        </a>
      </header>

      <picture
        style={{
          borderBottom: "1px solid var(--color-border)",
          borderTop: "1px solid var(--color-border)",
          flex: "1",
          fontSize: "0.75em",
          overflow: "hidden",
        }}
      >
        <img
          src={screenshotSrc}
          alt={`Screenshot for '${story.title}-${story.name}' Story`}
          style={{ height: "100%", objectFit: "cover", width: "100%" }}
        />
      </picture>

      {/* <footer
        style={{
          display: "flex",
          fontSize: "0.8em",
          gap: "1rem",
          justifyContent: "space-between",
          padding: "0.25rem 0.5rem",
        }}
      >
        <span>{story.tags.join(", ")}</span>
      </footer> */}
    </Card>
  );
}
