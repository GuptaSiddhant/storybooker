// oxlint-disable max-lines-per-function

import { Card, CardRow } from "../../components/card";
import { ErrorMessage } from "../../components/error-message";
import { urlBuilder } from "../../urls";
import { groupStoriesByTitle } from "../../utils/story-utils";
import type { BuildStoryType, BuildType } from "../schema";

export function BuildStories({
  build,
  projectId,
  stories,
}: {
  projectId: string;
  build: BuildType;
  stories: BuildStoryType[] | null;
}): JSX.Element | null {
  if (build.storybook === "none") {
    return (
      <p style={{ margin: "1rem" }}>
        The StoryBook is not yet uploaded for this build.
      </p>
    );
  }

  if (build.storybook !== "ready") {
    return (
      <p style={{ margin: "1rem" }}>
        The StoryBook is not yet ready/processed for this build.
      </p>
    );
  }

  if (!stories || stories.length === 0) {
    return (
      <ErrorMessage>Error loading stories from the StoryBook.</ErrorMessage>
    );
  }

  const allGroups = groupStoriesByTitle(stories);
  const isExpandedByDefault = Object.keys(allGroups).length <= 1;

  return (
    <>
      {Object.entries(allGroups).map(([groupTitle, group]) => {
        const groupEntries = Object.entries(group);

        return (
          <details open={isExpandedByDefault}>
            <summary style={{ fontWeight: "bold" }}>
              {groupTitle} [{groupEntries.length}]
            </summary>
            <div
              style={{
                borderLeft: `1px solid var(--color-border)`,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                paddingLeft: "1rem",
                paddingTop: "0.5rem",
              }}
            >
              {groupEntries.map(([title, list]) => {
                return (
                  <details open={false}>
                    <summary style={{ fontWeight: "normal" }}>
                      {title} ({list.length})
                    </summary>
                    <CardRow
                      style={{ borderLeft: `1px solid var(--color-border)` }}
                    >
                      {list.map((story) => (
                        <StoryCard
                          projectId={projectId}
                          sha={build.sha}
                          story={story}
                          hasScreenshots={build.screenshots === "ready"}
                        />
                      ))}
                    </CardRow>
                  </details>
                );
              })}
            </div>
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
  hasScreenshots,
}: {
  projectId: string;
  sha: string;
  story: BuildStoryType;
  hasScreenshots: boolean;
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
        {hasScreenshots ? (
          <img
            alt={`Screenshot for '${story.title}-${story.name}' Story`}
            loading="lazy"
            src={screenshotSrc}
            style={{ height: "100%", objectFit: "cover", width: "100%" }}
          />
        ) : (
          <div style={{ padding: "0.5rem" }}>No screenshot available.</div>
        )}
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
