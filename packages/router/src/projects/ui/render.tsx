import { DestructiveButton, LinkButton } from "#components/button";
import { DocumentLayout } from "#components/document";
import { RawDataPreview } from "#components/raw-data";
import type { ProjectType } from "#projects/schema";
import { getStore } from "#store";
import { urlBuilder } from "#utils/url-builder";
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
}: {
  project: ProjectType;
}): JSX.Element {
  const { url } = getStore();

  return (
    <DocumentLayout
      title={project.name}
      breadcrumbs={[{ href: urlBuilder.allProjects(), label: "Projects" }]}
      toolbar={
        <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
          <LinkButton href={urlBuilder.projectIdEdit(project.id)}>
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
    >
      <RawDataPreview data={project} summary={"Project details"} />
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

export function renderProjectEditPage({
  project,
}: {
  project: ProjectType;
}): JSX.Element {
  return (
    <DocumentLayout
      title="Create Project"
      breadcrumbs={[
        { href: urlBuilder.allProjects(), label: "Projects" },
        { href: urlBuilder.projectId(project.id), label: project.name },
      ]}
    >
      <ProjectForm project={project} />
    </DocumentLayout>
  );
}
