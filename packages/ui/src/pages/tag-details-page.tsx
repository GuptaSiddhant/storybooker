import type { BuildType, ProjectType, TagType } from "@storybooker/core/types";
import { BuildsTable } from "../components/builds-table";
import { DestructiveButton, LinkButton } from "../components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { RawDataList } from "../components/raw-data";
import { confirmDelete } from "../utils/text-utils";
import { getUIStore } from "../utils/ui-store";

export function TagDetailsPage({
  tag,
  project,
  builds,
}: {
  tag: TagType;
  project: ProjectType;
  builds: BuildType[];
}): JSXElement {
  const { urlBuilder } = getUIStore();
  const deleteUrl = urlBuilder.tagDelete(project.id, tag.id);

  return (
    <DocumentLayout title={`Tag ${tag.value}`}>
      <DocumentHeader
        breadcrumbs={[project.name, "Tags"]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.buildCreate(project.id, tag.id)}>
              + Create Build
            </LinkButton>
            <LinkButton href={urlBuilder.tagUpdate(project.id, tag.id)}>
              Edit
            </LinkButton>
            <form
              method="post"
              action={deleteUrl}
              hx-post={deleteUrl}
              hx-confirm={confirmDelete("Tag", tag.id)}
            >
              <DestructiveButton>Delete</DestructiveButton>
            </form>
          </div>
        }
      >{`[${tag.type}] ${tag.value}`}</DocumentHeader>
      <DocumentMain>
        <BuildsTable
          builds={builds}
          project={project}
          tags={undefined}
          toolbar={<a href={urlBuilder.buildsList(project.id)}>View all</a>}
        />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <RawDataList data={tag} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
