// oxlint-disable max-lines-per-function

import type { BuildType } from "../../builds/schema";
import { BuildsTable } from "../../builds/ui/builds-table";
import { DestructiveButton, LinkButton } from "../../components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../../components/document";
import { RawDataList } from "../../components/raw-data";
import type { LabelType } from "../../labels/schema";
import { LabelsTable } from "../../labels/ui/labels-table";
import type { ProjectType } from "../../projects/schema";
import { href, urlBuilder, URLS } from "../../urls";
import { commonT, getT } from "../../utils/i18n";
import { getStore } from "../../utils/store";
import { ProjectForm } from "./project-form";
import { ProjectsTable } from "./projects-table";

export function renderProjectsPage({
  projects,
}: {
  projects: ProjectType[];
}): JSX.Element {
  const title = `${commonT.All()} ${commonT.Projects()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[commonT.Home()]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.projectCreate()}>
              + {commonT.Create()}
            </LinkButton>
            <form
              hx-post={href(URLS.ui.purge)}
              hx-confirm={commonT.confirmPurge()}
            >
              <DestructiveButton>
                {commonT.Purge()} {commonT.All()}
              </DestructiveButton>
            </form>
          </div>
        }
      >
        {title}
      </DocumentHeader>
      <DocumentMain>
        <ProjectsTable projects={projects} caption={""} />
      </DocumentMain>
      <DocumentSidebar />
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderProjectDetailsPage({
  project,
  recentBuilds,
  recentLabels,
}: {
  project: ProjectType;
  recentBuilds: BuildType[];
  recentLabels: LabelType[];
}): JSX.Element {
  const { url } = getStore();

  return (
    <DocumentLayout title={project.name}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.allProjects(), label: commonT.Projects() },
        ]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.buildCreate(project.id)}>
              + {commonT.Create()} {commonT.Build()}
            </LinkButton>
            <LinkButton href={urlBuilder.projectIdUpdate(project.id)}>
              {commonT.Edit()}
            </LinkButton>
            <form
              hx-post={href(URLS.ui.purge, null, { project: project.id })}
              hx-confirm={commonT.confirmPurge()}
            >
              <DestructiveButton>{commonT.Purge()}</DestructiveButton>
            </form>
            <form
              hx-delete={url}
              hx-confirm={commonT.confirmDelete(
                commonT.Project(),
                project.name,
              )}
            >
              <DestructiveButton>{commonT.Delete()}</DestructiveButton>
            </form>
          </div>
        }
      >
        {project.name}
      </DocumentHeader>
      <DocumentMain>
        <LabelsTable
          labels={recentLabels}
          project={project}
          caption={`${commonT.Recent()} ${commonT.Labels()}`}
          toolbar={
            <a href={urlBuilder.allLabels(project.id)}>{commonT.ViewAll()}</a>
          }
        />
        <BuildsTable
          builds={recentBuilds}
          labels={recentLabels}
          project={project}
          caption={`${commonT.Recent()} ${commonT.Builds()}`}
          toolbar={
            <a href={urlBuilder.allBuilds(project.id)}>{commonT.ViewAll()}</a>
          }
        />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <RawDataList data={project} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderProjectCreatePage(): JSX.Element {
  const title = `${commonT.Create()} ${commonT.Project()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.allProjects(), label: commonT.Projects() },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <ProjectForm project={undefined} />
      </DocumentMain>
      <DocumentSidebar style={{ fontSize: "0.9em", padding: "1rem" }}>
        {getT("messages", "create_project_info")}
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderProjectUpdatePage({
  project,
}: {
  project: ProjectType;
}): JSX.Element {
  const title = `${commonT.Update()} ${commonT.Project()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.allProjects(), label: commonT.Projects() },
          { href: urlBuilder.projectId(project.id), label: project.name },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <ProjectForm project={project} />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <RawDataList data={{ "Project ID": project.id }} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
