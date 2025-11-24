import { getStore } from "@storybooker/core/store";
import type { BuildType, ProjectType, TagType } from "@storybooker/core/types";
import { urlBuilder } from "@storybooker/core/url";
import { Table } from "./components/table";
import { commonT } from "./translations/i18n";

export interface BuildsTableProps {
  caption?: JSXChildren;
  builds: BuildType[];
  project: ProjectType;
  tags: TagType[] | undefined;
  toolbar?: JSXChildren;
}

export function BuildsTable({
  caption,
  toolbar,
  builds,
  project,
  tags,
}: BuildsTableProps): JSXElement {
  const { locale } = getStore();

  return (
    <Table
      caption={caption ?? `${commonT.Builds()} (${builds.length})`}
      toolbar={toolbar}
      data={builds}
      columns={[
        {
          id: "createdAt",
          header: commonT.CreatedAt(),
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
          id: "id",
          header: "ID/SHA",
          cell: (item) => {
            return (
              <a safe href={urlBuilder.buildDetails(project.id, item.id)}>
                {item.id.slice(0, 7)}
              </a>
            );
          },
        },
        tags
          ? {
              id: "tag",
              header: commonT.Tags(),
              cell: (item) => {
                return (
                  <div>
                    {item.tagIds?.split(",").map((id, index, arr) => {
                      const tag = tags.find((tag) => tag.id === id);
                      return (
                        <>
                          <a
                            safe
                            href={urlBuilder.tagDetails(project.id, id)}
                            title={id}
                          >
                            {tag ? `${tag.value} (${tag.type})` : id}
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
          header: commonT.StoryBook(),
          cell: (item) => {
            if (item.storybook === "none") {
              return <span class="description">No StoryBook uploaded yet</span>;
            }

            return (
              <div style={{ display: "flex", gap: "1rem" }}>
                <a
                  href={urlBuilder.storybookIndexHtml(project.id, item.id)}
                  target="_blank"
                >
                  {commonT.View()}
                </a>
                <a
                  href={urlBuilder.storybookDownload(project.id, item.id)}
                  target="_blank"
                  download={`storybook-${project.id}-${item.id}.zip`}
                >
                  {commonT.Download()}
                </a>
              </div>
            );
          },
        },
        {
          id: "test",
          header: "Tests",
          cell: (item) => {
            if (item.testReport === "none") {
              return (
                <span class="description">
                  No test/coverage report uploaded yet
                </span>
              );
            }

            return (
              <div style={{ display: "flex", gap: "1rem" }}>
                <a
                  href={urlBuilder.storybookTestReport(project.id, item.id)}
                  target="_blank"
                >
                  Test Report
                </a>
                <a
                  href={urlBuilder.storybookCoverage(project.id, item.id)}
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
                    item.id,
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
