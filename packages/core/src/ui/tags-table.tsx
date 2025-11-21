import type { ProjectType } from "../models/projects-schema";
import type { TagType } from "../models/tags-schema";
import { href, urlBuilder, URLS } from "../urls";
import { getStore } from "../utils/store";
import { urlJoin } from "../utils/url-utils";
import { LatestBuild } from "./components/latest-build";
import { Table } from "./components/table";
import { commonT } from "./translations/i18n";

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
  const { locale } = getStore();

  return (
    <Table
      caption={caption ?? `${commonT.Tags()} (${tags.length})`}
      data={tags}
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
                href={href(URLS.tags.id, {
                  projectId: project.id,
                  tagSlug: item.slug,
                })}
              >
                {item.slug}
              </a>
            );
          },
        },
        {
          id: "value",
          header: commonT.Tag(),
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
          header: commonT.Type(),
          style: { fontFamily: "monospace", fontSize: "0.9em" },
        },
        {
          id: "builds",
          header: commonT.Builds(),
          cell: (item) => <span>{item.buildsCount}</span>,
        },
        {
          id: "build",
          header: `${commonT.Latest()} ${commonT.Build()}`,
          cell: (item) => (
            <LatestBuild projectId={project.id} sha={item.latestBuildSHA} />
          ),
        },
        {
          id: "actions",
          header: commonT.Actions(),
          cell: (item) => {
            return (
              <a
                href={href(URLS.tags.id, {
                  projectId: project.id,
                  tagSlug: item.id,
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
