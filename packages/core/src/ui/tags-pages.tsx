import type { BuildType } from "../models/builds-schema";
import type { ProjectType } from "../models/projects-schema";
import { TagTypes, type TagType } from "../models/tags-schema";
import { urlBuilder } from "../urls";
import { getStore } from "../utils/store";
import { BuildsTable } from "./builds-table";
import { DestructiveButton, LinkButton } from "./components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "./components/document";
import { RawDataList } from "./components/raw-data";
import { TagForm } from "./tag-form";
import { TagsTable } from "./tags-table";
import { commonT } from "./translations/i18n";

export function renderTagsPage({
  tags,
  project,
  defaultType,
}: {
  tags: TagType[];
  project: ProjectType;
  defaultType: string | null;
}): JSX.Element {
  const title = `${commonT.All()} ${commonT.Tags()} ${defaultType ? `(${defaultType.toUpperCase()})` : ""}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[project.name]}
        toolbar={
          <LinkButton href={urlBuilder.tagCreate(project.id)}>
            + {commonT.Create()}
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
            <label for="filter-type">{commonT.Type()}</label>
            <select id="filter-type" name="type">
              <option value="">
                {commonT.All()} {commonT.Type()}
              </option>
              {TagTypes.map((type) => (
                <option value={type} selected={defaultType === type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button style={{ height: "max-content" }}>
              {commonT.Filter()}
            </button>
            <LinkButton href={urlBuilder.allTags(project.id)} class="outline">
              {commonT.Clear()}
            </LinkButton>
          </div>
        </form>
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderTagDetailsPage({
  tag,
  project,
  builds,
}: {
  tag: TagType;
  project: ProjectType;
  builds: BuildType[];
}): JSX.Element {
  const { url } = getStore();

  return (
    <DocumentLayout title={`${commonT.Tag()} ${tag.value}`}>
      <DocumentHeader
        breadcrumbs={[project.name, commonT.Tags()]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.buildCreate(project.id, tag.id)}>
              + {commonT.Create()} {commonT.Build()}
            </LinkButton>
            <LinkButton href={urlBuilder.tagSlugUpdate(project.id, tag.id)}>
              {commonT.Edit()}
            </LinkButton>
            <form
              hx-delete={url}
              hx-confirm={commonT.confirmDelete(commonT.Tag(), tag.slug)}
            >
              <DestructiveButton>{commonT.Delete()}</DestructiveButton>
            </form>
          </div>
        }
      >{`[${tag.type}] ${tag.value}`}</DocumentHeader>
      <DocumentMain>
        <BuildsTable
          builds={builds}
          project={project}
          tags={undefined}
          toolbar={
            <a href={urlBuilder.allBuilds(project.id)}>{commonT.ViewAll()}</a>
          }
        />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <RawDataList data={tag} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderTagCreatePage({
  project,
}: {
  project: ProjectType;
}): JSX.Element {
  const title = `${commonT.Create()} ${commonT.Tag()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectId(project.id), label: project.name },
          { href: urlBuilder.allTags(project.id), label: commonT.Tags() },
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

export function renderTagUpdatePage({
  tag,
  projectId,
}: {
  tag: TagType;
  projectId: string;
}): JSX.Element {
  const title = `${commonT.Update()} ${commonT.Tag()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectId(projectId), label: projectId },
          { href: urlBuilder.allTags(projectId), label: commonT.Tags() },
          { href: urlBuilder.tagSlug(projectId, tag.id), label: tag.id },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <TagForm tag={tag} projectId={projectId} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
