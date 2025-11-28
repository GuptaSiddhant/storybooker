import type { BuildType, ProjectType } from "@storybooker/core/types";
import { BuildsTable } from "../components/builds-table";
import { LinkButton } from "../components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { getUIStore } from "../utils/ui-store";

export function BuildsListPage({
  builds,
  project,
}: {
  builds: BuildType[];
  project: ProjectType;
}): JSXElement {
  const title = `All Builds`;
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[project.name]}
        toolbar={
          <LinkButton href={urlBuilder.buildCreate(project.id)}>
            + Create
          </LinkButton>
        }
      >
        {title}
      </DocumentHeader>
      <DocumentMain>
        <BuildsTable caption={""} project={project} builds={builds} tags={[]} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
