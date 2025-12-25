import type { RenderedContent } from "@storybooker/core/adapter/~ui";
import type { BuildType, ProjectType, TagType } from "@storybooker/core/types";
import { BuildsTable } from "../components/builds-table.tsx";
import { DestructiveButton, LinkButton } from "../components/button.tsx";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document.tsx";
import { RawDataList } from "../components/raw-data.tsx";
import { TagsTable } from "../components/tags-table.tsx";
import { confirmDelete } from "../utils/text-utils.ts";
import { getUIStore } from "../utils/ui-store.ts";

export function ProjectDetailsPage({
  project,
  recentBuilds,
  recentTags,
}: {
  project: ProjectType;
  recentBuilds: BuildType[];
  recentTags: TagType[];
}): RenderedContent {
  const { urlBuilder } = getUIStore();
  const deleteUrl = urlBuilder.projectDelete(project.id);
  const purgeUrl = urlBuilder.taskPurge(project.id);

  return (
    <DocumentLayout title={project.name}>
      <DocumentHeader
        breadcrumbs={[{ href: urlBuilder.projectsList(), label: "Projects" }]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.buildCreate(project.id)}>+ Create Build</LinkButton>
            <LinkButton href={urlBuilder.projectUpdate(project.id)}>Edit</LinkButton>
            <form
              method="post"
              action={purgeUrl}
              hx-post={purgeUrl}
              hx-confirm={
                "Are you sure about purging this project? Purge will remove all builds older than the configured retention period."
              }
            >
              <DestructiveButton>Purge</DestructiveButton>
            </form>
            <form
              method="post"
              action={deleteUrl}
              hx-post={deleteUrl}
              hx-confirm={confirmDelete("Project", project.name)}
            >
              <DestructiveButton>Delete</DestructiveButton>
            </form>
          </div>
        }
      >
        {project.name}
      </DocumentHeader>
      <DocumentMain>
        <TagsTable
          tags={recentTags}
          project={project}
          caption={`Recent Tags`}
          toolbar={<a href={urlBuilder.tagsList(project.id)}>View All</a>}
        />
        <BuildsTable
          builds={recentBuilds}
          tags={recentTags}
          project={project}
          caption={`Recent Builds`}
          toolbar={<a href={urlBuilder.buildsList(project.id)}>View All</a>}
        />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <RawDataList data={project} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
