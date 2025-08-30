import { DocumentLayout } from "#components/document";
import { ProjectsTable } from "#projects-ui/projects-table";
import type { ProjectType } from "#projects/schema";
import { href, urlBuilder, URLS } from "#urls";

export interface RootPageProps {
  projects: ProjectType[];
}
export function renderRootPage({ projects }: RootPageProps): JSX.Element {
  return (
    <DocumentLayout
      title="Home"
      toolbar={
        <a href={href(URLS.ui.openapi)} target="_blank">
          OpenAPI
        </a>
      }
      style={{ padding: 0 }}
    >
      <ProjectsTable
        projects={projects}
        toolbar={<a href={urlBuilder.allProjects()}>View all</a>}
      />
    </DocumentLayout>
  );
}
