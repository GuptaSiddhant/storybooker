import type { RenderedContent } from "@storybooker/core/adapter";
import { TagTypes } from "@storybooker/core/constants";
import type { ProjectType, TagType } from "@storybooker/core/types";
import { LinkButton } from "../components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { TagsTable } from "../components/tags-table";
import { getUIStore } from "../utils/ui-store";

export function TagsListPage({
  tags,
  project,
  defaultType,
}: {
  tags: TagType[];
  project: ProjectType;
  defaultType?: string | null | undefined;
}): RenderedContent {
  const { urlBuilder } = getUIStore();

  const title = `All Tags ${defaultType ? `(${defaultType.toUpperCase()})` : ""}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[project.name]}
        toolbar={<LinkButton href={urlBuilder.tagCreate(project.id)}>+ Create</LinkButton>}
      >
        {title}
      </DocumentHeader>
      <DocumentMain>
        <TagsTable caption={""} project={project} tags={tags} />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <form style={{ display: "flex", gap: "1rem" }}>
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
