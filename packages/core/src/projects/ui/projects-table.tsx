// oxlint-disable sort-keys
// oxlint-disable max-lines-per-function

import { Table } from "#components/table";
import { DEFAULT_GITHUB_BRANCH } from "#constants";
import type { ProjectType } from "#projects/schema";
import { getStore } from "#store";
import { urlBuilder } from "#urls";

export interface ProjectsTableProps {
  caption?: JSX.Element;
  toolbar?: JSX.Element;
  projects: ProjectType[];
}

export function ProjectsTable({
  caption,
  toolbar,
  projects,
}: ProjectsTableProps): JSX.Element {
  const { locale } = getStore();

  return (
    <Table
      caption={caption ?? `Projects (${projects.length})`}
      toolbar={toolbar}
      data={projects}
      columns={[
        {
          id: "id",
          header: "ID",
          cell: (item) => {
            return (
              <a safe href={urlBuilder.projectId(item.id)}>
                {item.id}
              </a>
            );
          },
        },
        { id: "name", header: "Name" },
        {
          id: "gitHub",
          header: "GitHub",
          cell: (item) => {
            const pathnames = item.gitHubPath
              ? [
                  "tree",
                  item.gitHubDefaultBranch || DEFAULT_GITHUB_BRANCH,
                  item.gitHubPath,
                ]
              : [];
            const href = urlBuilder.gitHub(item.gitHubRepository, ...pathnames);

            return (
              <a safe href={href} target="_blank" rel="noopener noreferrer">
                {item.gitHubRepository}
              </a>
            );
          },
        },
        {
          id: "build",
          header: "Latest build",
          cell: (item) => {
            if (!item.latestBuildSHA) {
              return <span class="description">No build available</span>;
            }

            return (
              <div
                style={{ display: "flex", columnGap: "1rem", flexWrap: "wrap" }}
              >
                <span safe style={{ fontFamily: "monospace" }}>
                  [{item.latestBuildSHA.slice(0, 7)}]
                </span>
                <a href={urlBuilder.buildSHA(item.id, item.latestBuildSHA)}>
                  Details
                </a>
                <a
                  href={urlBuilder.storybookIndexHtml(
                    item.id,
                    item.latestBuildSHA,
                  )}
                >
                  Storybook
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
        {
          id: "createdAt",
          header: "Created",
          cell: (item) => {
            if (!item.createdAt) {
              return null;
            }

            return (
              <time datetime={item.createdAt} safe>
                {new Date(item.createdAt).toLocaleString(locale)}
              </time>
            );
          },
        },
      ]}
    />
  );
}
