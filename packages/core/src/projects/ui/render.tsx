// oxlint-disable max-lines-per-function

import { BuildsTable } from "#builds-ui/builds-table";
import type { BuildType } from "#builds/schema";
import { DestructiveButton, LinkButton } from "#components/button";
import { DocumentLayout } from "#components/document";
import { RawDataPreview } from "#components/raw-data";
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
  return (
    <DocumentLayout
      title="All Projects"
      toolbar={
        <LinkButton href={urlBuilder.projectCreate()}>+ Create</LinkButton>
      }
      style={{ padding: 0 }}
    >
      <ProjectsTable projects={projects} caption={""} />
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
    <DocumentLayout
      title={project.name}
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
      sidebar={
        <RawDataPreview data={project} summary={"Project details"} open />
      }
      style={{ padding: 0 }}
    >
      <>
        <LabelsTable
          labels={recentLabels}
          projectId={project.id}
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
      </>
    </DocumentLayout>
  );
}

export function renderProjectCreatePage(): JSX.Element {
  return (
    <DocumentLayout
      title="Create Project"
      breadcrumbs={[{ href: urlBuilder.allProjects(), label: "Projects" }]}
    >
      <ProjectForm project={undefined} />
    </DocumentLayout>
  );
}

export function renderProjectUpdatePage({
  project,
}: {
  project: ProjectType;
}): JSX.Element {
  return (
    <DocumentLayout
      title="Update Project"
      breadcrumbs={[
        { href: urlBuilder.allProjects(), label: "Projects" },
        { href: urlBuilder.projectId(project.id), label: project.name },
      ]}
    >
      <ProjectForm project={project} />
    </DocumentLayout>
  );
}
