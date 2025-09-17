// oxlint-disable max-lines-per-function

import { BuildsTable } from "#builds-ui/builds-table";
import type { BuildType } from "#builds/schema";
import { DestructiveButton, LinkButton } from "#components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "#components/document";
import { RawDataTabular } from "#components/raw-data";
import { LabelsTable } from "#labels-ui/labels-table";
import type { LabelType } from "#labels/schema";
import type { ProjectType } from "#projects/schema";
import { getStore } from "#store";
import { urlBuilder } from "#urls";
import { ProjectForm } from "./project-form";
import { ProjectsTable } from "./projects-table";

export function renderProjectsPage({
  projects,
}: {
  projects: ProjectType[];
}): JSX.Element {
  const title = "All projects";

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={["Home"]}
        toolbar={
          <LinkButton href={urlBuilder.projectCreate()}>+ Create</LinkButton>
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
        breadcrumbs={[{ href: urlBuilder.allProjects(), label: "Projects" }]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.buildCreate(project.id)}>
              + Create build
            </LinkButton>
            <LinkButton href={urlBuilder.projectIdUpdate(project.id)}>
              Edit
            </LinkButton>
            <form
              hx-delete={url}
              hx-confirm={`Are you sure about deleting the project '${project.name}'?`}
            >
              <DestructiveButton>Delete</DestructiveButton>
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
          caption={"Recent labels"}
          toolbar={<a href={urlBuilder.allLabels(project.id)}>View all</a>}
        />
        <BuildsTable
          builds={recentBuilds}
          labels={recentLabels}
          project={project}
          caption={"Recent builds"}
          toolbar={<a href={urlBuilder.allBuilds(project.id)}>View all</a>}
        />
      </DocumentMain>
      <DocumentSidebar>
        <RawDataTabular data={project} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderProjectCreatePage(): JSX.Element {
  const title = "Create Project";

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[{ href: urlBuilder.allProjects(), label: "Projects" }]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <ProjectForm project={undefined} />
      </DocumentMain>
      <DocumentSidebar />
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderProjectUpdatePage({
  project,
}: {
  project: ProjectType;
}): JSX.Element {
  const title = "Update Project";

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.allProjects(), label: "Projects" },
          { href: urlBuilder.projectId(project.id), label: project.name },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <ProjectForm project={project} />
      </DocumentMain>
      <DocumentSidebar />
      <DocumentUserSection />
    </DocumentLayout>
  );
}
