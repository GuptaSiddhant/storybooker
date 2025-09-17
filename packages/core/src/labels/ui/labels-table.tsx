// oxlint-disable sort-keys
// oxlint-disable max-lines-per-function

import { Table } from "#components/table";
import type { LabelType } from "#labels/schema";
import type { ProjectType } from "#projects/schema";
import { href, urlBuilder, URLS } from "#urls";
import { getStore } from "#utils/store";
import { urlJoin } from "#utils/url";

export interface LabelsTableProps {
  caption?: JSX.Element;
  project: ProjectType;
  toolbar?: JSX.Element;
  labels: LabelType[];
}

export function LabelsTable({
  labels,
  project,
  toolbar,
  caption,
}: LabelsTableProps): JSX.Element {
  const { locale } = getStore();

  return (
    <Table
      caption={caption ?? `Labels (${labels.length})`}
      data={labels}
      toolbar={toolbar}
      columns={[
        {
          id: "updatedAt",
          header: "Last modified",
          cell: (item) => {
            if (!item.updatedAt) {
              return null;
            }

            return (
              <time datetime={item.updatedAt} safe>
                {new Date(item.updatedAt).toLocaleString(locale)}
              </time>
            );
          },
        },
        {
          id: "slug",
          header: "Slug",
          cell: (item) => {
            return (
              <a
                href={href(URLS.labels.id, {
                  projectId: project.id,
                  labelSlug: item.slug,
                })}
              >
                {item.slug}
              </a>
            );
          },
        },
        {
          id: "value",
          header: "Label",
          cell: (item) => {
            let href = "";
            switch (item.type) {
              case "branch": {
                href = urlBuilder.gitHub(
                  project.gitHubRepository,
                  "tree",
                  item.value,
                );
                break;
              }
              case "pr": {
                href = urlBuilder.gitHub(
                  project.gitHubRepository,
                  "pull",
                  item.value,
                );
                break;
              }
              case "jira": {
                href = project.jiraDomain
                  ? urlJoin(project.jiraDomain, "browse", item.value)
                  : "";
                break;
              }
              default:
            }

            if (!href) {
              return item.value;
            }

            return (
              <a href={href} target="_blank">
                {item.value}
              </a>
            );
          },
        },
        {
          id: "type",
          header: "Type",
          style: { fontFamily: "monospace", fontSize: "0.9em" },
        },
        {
          id: "build",
          header: "Latest build",
          cell: (item) => {
            if (!item.latestBuildSHA) {
              return <span class="description">No build available</span>;
            }

            return (
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span
                  safe
                  style={{ fontFamily: "monospace", fontSize: "0.9em" }}
                >
                  [{item.latestBuildSHA.slice(0, 7)}]
                </span>
                <a href={urlBuilder.buildSHA(project.id, item.latestBuildSHA)}>
                  Details
                </a>
                <a
                  href={urlBuilder.storybookIndexHtml(
                    project.id,
                    item.latestBuildSHA,
                  )}
                >
                  StoryBook
                </a>
              </div>
            );
          },
        },

        {
          id: "actions",
          header: "Actions",
          cell: (item) => {
            return (
              <a
                href={href(URLS.labels.id, {
                  projectId: project.id,
                  labelSlug: item.id,
                })}
              >
                View builds
              </a>
            );
          },
        },
      ]}
    />
  );
}
