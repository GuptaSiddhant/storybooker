// oxlint-disable max-lines-per-function
// oxlint-disable sort-keys

import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { ErrorMessage } from "../components/error-message";
import type { ProjectType } from "../projects/schema";
import { ProjectsTable } from "../projects/ui/projects-table";
import { href, urlBuilder, URLS } from "../urls";
import { commonT } from "../utils/i18n";
import { getStore } from "../utils/store";
import { toTitleCase } from "../utils/text-utils";

export interface RootPageProps {
  projects: ProjectType[];
}
export function renderRootPage({ projects }: RootPageProps): JSX.Element {
  const pageTitle = commonT.Home();

  return (
    <DocumentLayout title={pageTitle}>
      <DocumentHeader
        toolbar={
          <a href={href(URLS.ui.openapi)} target="_blank">
            OpenAPI
          </a>
        }
      >
        {pageTitle}
      </DocumentHeader>
      <DocumentMain style={{ padding: 0 }}>
        <ProjectsTable
          projects={projects}
          toolbar={<a href={urlBuilder.allProjects()}>{commonT.ViewAll()}</a>}
        />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <a href={href(URLS.projects.create)}>
          {commonT.Create()} {commonT.Project()}
        </a>
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderErrorPage({
  title,
  message,
}: {
  title: string;
  message: string;
}): JSX.Element {
  const { translation } = getStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          {
            href: "javascript:history.back()",
            label: `< ${toTitleCase(translation.dictionary.back)}`,
          },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: 0 }}>
        <ErrorMessage>{message}</ErrorMessage>
      </DocumentMain>
      <DocumentSidebar />
      <DocumentUserSection />
    </DocumentLayout>
  );
}
