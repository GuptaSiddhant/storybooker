import type { ProjectType } from "@storybooker/core/types";
import { DestructiveButton, LinkButton } from "../components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { ProjectsTable } from "../components/projects-table";
import { getUIStore } from "../utils/ui-store";

export function ProjectsListPage({ projects }: { projects: ProjectType[] }): JSXElement {
  const title = `All Projects`;

  const { urlBuilder } = getUIStore();
  const purgeUrl = urlBuilder.taskPurge();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={["Home"]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.projectCreate()}>+ Create</LinkButton>
            <form
              method="post"
              action={purgeUrl}
              hx-post={purgeUrl}
              hx-confirm={"Are you sure about purging all projects?"}
            >
              <DestructiveButton>Purge All</DestructiveButton>
            </form>
          </div>
        }
      >
        {title}
      </DocumentHeader>
      <DocumentMain>
        <ProjectsTable projects={projects} caption={""} />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <a href={urlBuilder.projectCreate()}>Create Project</a>
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
