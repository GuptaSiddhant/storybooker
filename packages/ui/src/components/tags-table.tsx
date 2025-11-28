import type { ProjectType, TagType } from "@storybooker/core/types";
import { urlJoin } from "@storybooker/core/url";
import { getUIStore } from "../utils/ui-store";
import { LatestBuild } from "./latest-build";
import { Table } from "./table";

export interface TagsTableProps {
  caption?: JSXChildren;
  project: ProjectType;
  toolbar?: JSXChildren;
  tags: TagType[];
}

export function TagsTable({
  tags,
  project,
  toolbar,
  caption,
}: TagsTableProps): JSXElement {
  const { locale, urlBuilder } = getUIStore();

  return (
    <Table
      caption={caption ?? `Tags (${tags.length})`}
      data={tags}
      toolbar={toolbar}
      columns={[
        {
          id: "updatedAt",
          header: "Updated at",
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
          id: "id",
          header: "ID",
          cell: (item) => {
            return (
              <a href={urlBuilder.tagDetails(project.id, item.id)}>{item.id}</a>
            );
          },
        },
        {
          id: "value",
          header: "Tag",
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
              return <>{item.value}</>;
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
          id: "builds",
          header: "Builds",
          cell: (item) => <span>{item.buildsCount}</span>,
        },
        {
          id: "build",
          header: `Latest Build`,
          cell: (item) => (
            <LatestBuild projectId={project.id} buildId={item.latestBuildId} />
          ),
        },
        {
          id: "actions",
          header: "Actions",
          cell: (item) => {
            return (
              <a href={urlBuilder.tagDetails(project.id, item.id)}>
                View builds
              </a>
            );
          },
        },
      ]}
    />
  );
}
