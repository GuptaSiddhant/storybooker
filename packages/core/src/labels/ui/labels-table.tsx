// oxlint-disable sort-keys
// oxlint-disable max-lines-per-function

import { Table } from "#components/table";
import type { LabelType } from "#labels/schema";
import { urlBuilder } from "#urls";
import { getStore } from "#utils/store";

export interface LabelsTableProps {
  caption?: JSX.Element;
  projectId: string;
  toolbar?: JSX.Element;
  labels: LabelType[];
}

export function LabelsTable({
  labels,
  projectId,
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
          id: "slug",
          header: "Slug",
          cell: (item) => {
            return (
              <a safe href={urlBuilder.labelSlug(projectId, item.slug)}>
                {item.slug}
              </a>
            );
          },
        },
        {
          id: "value",
          header: "Label",
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
                <a href={urlBuilder.buildSHA(projectId, item.latestBuildSHA)}>
                  Details
                </a>
                <a
                  href={urlBuilder.storybookIndexHtml(
                    projectId,
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
      ]}
    />
  );
}
