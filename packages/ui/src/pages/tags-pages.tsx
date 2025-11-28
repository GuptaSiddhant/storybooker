import { TagTypes } from "@storybooker/core/constants";
import type { BuildType, ProjectType, TagType } from "@storybooker/core/types";
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
import { BuildsTable } from "./builds-table";
import { TagForm } from "./tag-form";
import { TagsTable } from "./tags-table";

export function TagsListPage({
  tags,
  project,
  defaultType,
}: {
  tags: TagType[];
  project: ProjectType;
  defaultType: string | null | undefined;
}): JSXElement {
  const title = `All Tags ${defaultType ? `(${defaultType.toUpperCase()})` : ""}`;
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[project.name]}
        toolbar={
          <LinkButton href={urlBuilder.tagCreate(project.id)}>
            + Create
          </LinkButton>
        }
      >
        {title}
      </DocumentHeader>
      <DocumentMain>
        <TagsTable caption={""} project={project} tags={tags} />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <form
          style={{
            display: "flex",
            gap: "1rem",
          }}
        >
          <div class="field" style={{ minWidth: "100px" }}>
            <label for="filter-type">Type</label>
            <select id="filter-type" name="type">
              <option value="">All Types</option>
              {TagTypes.map((type) => (
                <option value={type} selected={defaultType === type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button style={{ height: "max-content" }}>Filter</button>
            <LinkButton href={urlBuilder.tagsList(project.id)} class="outline">
              Clear
            </LinkButton>
          </div>
        </form>
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

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

export function TagCreatePage({
  project,
}: {
  project: ProjectType;
}): JSXElement {
  const title = "Create Tag";
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectDetails(project.id), label: project.name },
          { href: urlBuilder.tagsList(project.id), label: "Tags" },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <TagForm tag={undefined} projectId={project.id} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function TagUpdatePage({
  tag,
  project,
}: {
  tag: TagType;
  project: ProjectType;
}): JSXElement {
  const title = "Update Tag";
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectDetails(project.id), label: project.name },
          { href: urlBuilder.tagsList(project.id), label: "Tags" },
          { href: urlBuilder.tagDetails(project.id, tag.id), label: tag.id },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <TagForm tag={tag} projectId={project.id} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
