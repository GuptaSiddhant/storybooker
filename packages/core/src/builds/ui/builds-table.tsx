// oxlint-disable sort-keys
// oxlint-disable max-lines-per-function

import type { BuildType } from "#builds/schema";
import { Table } from "#components/table";
import type { LabelType } from "#labels/schema";
import type { ProjectType } from "#projects/schema";
import { getStore } from "#store";
import { urlBuilder } from "#utils/url-builder";

export interface BuildsTableProps {
  caption?: JSX.Element;
  builds: BuildType[];
  project: ProjectType;
  labels: LabelType[] | undefined;
  toolbar?: JSX.Element;
}

export function BuildsTable({
  caption,
  toolbar,
  builds,
  project,
  labels,
}: BuildsTableProps): JSX.Element {
  const { locale } = getStore();

  return (
    <Table
      caption={caption ?? `Builds (${builds.length})`}
      toolbar={toolbar}
      data={builds}
      columns={[
        {
          id: "createdAt",
          header: "Timestamp",
          cell: (item) => {
            const time = item.createdAt || item.updatedAt;
            if (!time) {
              return null;
            }

            return (
              <time datetime={time} safe>
                {new Date(time).toLocaleString(locale)}
              </time>
            );
          },
        },
        {
          id: "sha",
          header: "SHA",
          cell: (item) => {
            return (
              <a safe href={urlBuilder.buildSHA(project.id, item.sha)}>
                {item.sha.slice(0, 7)}
              </a>
            );
          },
        },
        labels
          ? {
              id: "label",
              header: "Labels",
              cell: (item) => {
                return (
                  <div>
                    {item.labelSlugs.split(",").map((labelSlug, index, arr) => {
                      const label = labels.find(
                        (label) => label.slug === labelSlug,
                      );
                      return (
                        <>
                          <a
                            safe
                            href={urlBuilder.labelSlug(project.id, labelSlug)}
                            title={labelSlug}
                          >
                            {label
                              ? `${label.value} (${label.type})`
                              : labelSlug}
                          </a>
                          {index === arr.length - 1 ? null : <span>, </span>}
                        </>
                      );
                    })}
                  </div>
                );
              },
            }
          : undefined,
        {
          id: "storybook",
          header: "Storybook",
          cell: (item) => {
            if (!item.hasStorybook) {
              return <span class="description">No StoryBook uploaded yet</span>;
            }

            return (
              <div style={{ display: "flex", gap: "1rem" }}>
                <a
                  href={urlBuilder.storybookIndexHtml(project.id, item.sha)}
                  target="_blank"
                >
                  View
                </a>
                <a
                  href={urlBuilder.storybookZip(project.id, item.sha)}
                  target="_blank"
                  download={`storybook-${project.id}-${item.sha}.zip`}
                >
                  Download
                </a>
              </div>
            );
          },
        },
        {
          id: "test",
          header: "Tests",
          cell: (item) => {
            if (!item.hasTestReport) {
              return (
                <span class="description">
                  No test/coverage report uploaded yet
                </span>
              );
            }

            return (
              <div style={{ display: "flex", gap: "1rem" }}>
                <a
                  href={urlBuilder.storybookTestReport(project.id, item.sha)}
                  target="_blank"
                >
                  Test Report
                </a>
                <a
                  href={urlBuilder.storybookCoverage(project.id, item.sha)}
                  target="_blank"
                >
                  Coverage
                </a>
              </div>
            );
          },
        },
        {
          id: "gitHub",
          header: "GitHub",
          cell: (item) => {
            return (
              <div style={{ display: "flex", gap: "1rem" }}>
                <a
                  href={urlBuilder.gitHub(
                    project.gitHubRepository,
                    "commit",
                    item.sha,
                  )}
                  target="_blank"
                >
                  Commit
                </a>
              </div>
            );
          },
        },
        { id: "message", header: "Message" },
        {
          id: "authorName",
          header: "Author",
          cell: (item) => (
            <span safe title={item.authorEmail}>
              {item.authorName || "Unknown"}
            </span>
          ),
        },
      ]}
    />
  );
}
