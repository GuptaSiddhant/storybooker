import type { ProjectType, TagType } from "storybooker/~internal/types";
import { urlJoin } from "storybooker/~internal/url";
import { getUIStore } from "../utils/ui-store.ts";
import { Icon } from "./icon.tsx";
import { LatestBuild } from "./latest-build.tsx";
import { Table } from "./table.tsx";

export interface TagsTableProps {
  caption?: JSXChildren;
  project: ProjectType;
  toolbar?: JSXChildren;
  tags: TagType[];
}

export function TagsTable({ tags, project, toolbar, caption }: TagsTableProps): JSXElement {
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
          header: "Tag",
          cell: (item) => {
            return <a href={urlBuilder.tagDetails(project.id, item.id)}>{item.value}</a>;
          },
        },
        {
          id: "type",
          header: "Type",
          style: { fontFamily: "monospace", fontSize: "0.9em" },
          cell: (item) => {
            let href = "";
            switch (item.type) {
              case "branch": {
                href = urlBuilder.gitHub(project.gitHubRepository, "tree", item.value);
                break;
              }
              case "pr": {
                href = urlBuilder.gitHub(project.gitHubRepository, "pull", item.value);
                break;
              }
              case "jira": {
                href = project.jiraDomain ? urlJoin(project.jiraDomain, "browse", item.value) : "";
                break;
              }
              default:
            }

            if (!href) {
              return <span>{item.type}</span>;
            }

            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {item.type} <Icon name="externalLink" label="Open link" />
              </a>
            );
          },
        },
        {
          id: "builds",
          header: "Builds",
          cell: (item) => <span>{item.buildsCount}</span>,
        },
        {
          id: "build",
          header: `Latest Build`,
          cell: (item) => <LatestBuild projectId={project.id} buildId={item.latestBuildId} />,
        },
        {
          id: "actions",
          header: "Actions",
          cell: (item) => {
            return <a href={urlBuilder.tagDetails(project.id, item.id)}>View builds</a>;
          },
        },
      ]}
    />
  );
}
