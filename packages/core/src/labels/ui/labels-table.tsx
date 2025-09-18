// oxlint-disable sort-keys
// oxlint-disable max-lines-per-function

import { Table } from "#components/table";
import type { LabelType } from "#labels/schema";
import type { ProjectType } from "#projects/schema";
import { href, urlBuilder, URLS } from "#urls";
import { commonT, getT } from "#utils/i18n";
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
      caption={caption ?? `${commonT.Labels()} (${labels.length})`}
      data={labels}
      toolbar={toolbar}
      columns={[
        {
          id: "updatedAt",
          header: commonT.UpdatedAt(),
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
          header: commonT.Slug(),
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
          header: commonT.Label(),
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
          header: commonT.Type(),
          style: { fontFamily: "monospace", fontSize: "0.9em" },
        },
        {
          id: "build",
          header: `${commonT.Latest()} ${commonT.Build()}`,
          cell: (item) => {
            if (!item.latestBuildSHA) {
              return (
                <span class="description">
                  {getT("messages", "no_builds_available")}
                </span>
              );
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
                  {commonT.Details()}
                </a>
                <a
                  href={urlBuilder.storybookIndexHtml(
                    project.id,
                    item.latestBuildSHA,
                  )}
                >
                  {commonT.StoryBook()}
                </a>
              </div>
            );
          },
        },

        {
          id: "actions",
          header: commonT.Actions(),
          cell: (item) => {
            return (
              <a
                href={href(URLS.labels.id, {
                  projectId: project.id,
                  labelSlug: item.id,
                })}
              >
                {commonT.View()} {commonT.Builds()}
              </a>
            );
          },
        },
      ]}
    />
  );
}
