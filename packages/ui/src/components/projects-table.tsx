import { DEFAULT_GITHUB_BRANCH } from "@storybooker/core/constants";
import type { ProjectType } from "@storybooker/core/types";
import { getUIStore } from "../utils/ui-store";
import { LatestBuild } from "./latest-build";
import { Table } from "./table";

export interface ProjectsTableProps {
  caption?: JSXChildren;
  toolbar?: JSXChildren;
  projects: ProjectType[];
}

export function ProjectsTable({ caption, toolbar, projects }: ProjectsTableProps): JSXElement {
  const { locale, urlBuilder } = getUIStore();

  return (
    <Table
      caption={caption ?? `Projects (${projects.length})`}
      toolbar={toolbar}
      data={projects}
      columns={[
        {
          id: "name",
          header: "Name",
          cell: (item) => {
            return (
              <a
                safe
                href={urlBuilder.projectDetails(item.id)}
                style={{
                  fontWeight: "bold",
                  minWidth: "12ch",
                  width: "fit-content",
                }}
                title={item.id}
              >
                {item.name}
              </a>
            );
          },
        },
        {
          id: "build",
          header: `Latest Build`,
          cell: (item) => <LatestBuild projectId={item.id} buildId={item.latestBuildId} />,
        },
        {
          id: "gitHub",
          header: "GitHub",
          cell: (item) => {
            const pathnames = item.gitHubPath
              ? ["tree", item.gitHubDefaultBranch || DEFAULT_GITHUB_BRANCH, item.gitHubPath]
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
          id: "updatedAt",
          header: "Timestamp",
          cell: (item) => {
            if (!item.updatedAt) {
              return null;
            }

            return (
              <div>
                {item.updatedAt ? (
                  <div>
                    <span
                      style={{
                        color: "var(--color-text-secondary)",
                        fontSize: "small",
                      }}
                    >
                      Updated at:
                    </span>{" "}
                    <time datetime={item.updatedAt} safe>
                      {new Date(item.updatedAt).toLocaleString(locale)}
                    </time>
                  </div>
                ) : null}
                {item.createdAt ? (
                  <div>
                    <span
                      style={{
                        color: "var(--color-text-secondary)",
                        fontSize: "small",
                      }}
                    >
                      Created at:
                    </span>{" "}
                    <time datetime={item.createdAt} safe>
                      {new Date(item.createdAt).toLocaleString(locale)}
                    </time>
                  </div>
                ) : null}
              </div>
            );
          },
        },
      ]}
    />
  );
}
