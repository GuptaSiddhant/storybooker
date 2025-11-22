import type { ProjectType } from "../models/projects-schema";
import { urlBuilder } from "../urls";
import { DEFAULT_GITHUB_BRANCH } from "../utils/constants";
import { getStore } from "../utils/store";
import { LatestBuild } from "./components/latest-build";
import { Table } from "./components/table";
import { commonT, getT } from "./translations/i18n";

export interface ProjectsTableProps {
  caption?: JSXChildren;
  toolbar?: JSXChildren;
  projects: ProjectType[];
}

export function ProjectsTable({
  caption,
  toolbar,
  projects,
}: ProjectsTableProps): JSXElement {
  const { locale } = getStore();

  return (
    <Table
      caption={caption ?? `${commonT.Projects()} (${projects.length})`}
      toolbar={toolbar}
      data={projects}
      columns={[
        {
          id: "name",
          header: commonT.Name(),
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
          header: `${commonT.Latest()} ${getT("dictionary", "build")}`,
          cell: (item) => (
            <LatestBuild projectId={item.id} buildId={item.latestBuildId} />
          ),
        },
        {
          id: "gitHub",
          header: commonT.GitHub(),
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
          id: "updatedAt",
          header: commonT.Timestamp(),
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
                      {commonT.UpdatedAt()}:
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
                      {commonT.CreatedAt()}:
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
