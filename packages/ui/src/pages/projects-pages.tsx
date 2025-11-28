import type { BuildType, ProjectType, TagType } from "@storybooker/core/types";
import { DestructiveButton, LinkButton } from "../components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document";
import { RawDataList } from "../components/raw-data";
import { confirmDelete } from "../utils/text-utils";
import { getUIStore } from "../utils/ui-store";
import { BuildsTable } from "./builds-table";
import { ProjectForm } from "./project-form";
import { ProjectsTable } from "./projects-table";
import { TagsTable } from "./tags-table";

export function ProjectsPage({
  projects,
}: {
  projects: ProjectType[];
}): JSXElement {
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

export function ProjectDetailsPage({
  project,
  recentBuilds,
  recentTags,
}: {
  project: ProjectType;
  recentBuilds: BuildType[];
  recentTags: TagType[];
}): JSXElement {
  const { urlBuilder } = getUIStore();
  const deleteUrl = urlBuilder.projectDelete(project.id);
  const purgeUrl = urlBuilder.taskPurge(project.id);

  return (
    <DocumentLayout title={project.name}>
      <DocumentHeader
        breadcrumbs={[{ href: urlBuilder.projectsList(), label: "Projects" }]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.buildCreate(project.id)}>
              + Create Build
            </LinkButton>
            <LinkButton href={urlBuilder.projectUpdate(project.id)}>
              Edit
            </LinkButton>
            <form
              method="post"
              action={purgeUrl}
              hx-post={purgeUrl}
              hx-confirm={"Are you sure about purging this project?"}
            >
              <DestructiveButton>Purge</DestructiveButton>
            </form>
            <form
              method="post"
              action={deleteUrl}
              hx-post={deleteUrl}
              hx-confirm={confirmDelete("Project", project.name)}
            >
              <DestructiveButton>Delete</DestructiveButton>
            </form>
          </div>
        }
      >
        {project.name}
      </DocumentHeader>
      <DocumentMain>
        <TagsTable
          tags={recentTags}
          project={project}
          caption={`Recent Tags`}
          toolbar={<a href={urlBuilder.tagsList(project.id)}>View All</a>}
        />
        <BuildsTable
          builds={recentBuilds}
          tags={recentTags}
          project={project}
          caption={`Recent Builds`}
          toolbar={<a href={urlBuilder.buildsList(project.id)}>View All</a>}
        />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <RawDataList data={project} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function ProjectCreatePage(): JSXElement {
  const title = `Create Project`;
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[{ href: urlBuilder.projectsList(), label: "Projects" }]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <ProjectForm project={undefined} />
      </DocumentMain>
      <DocumentSidebar style={{ fontSize: "0.9em", padding: "1rem" }}>
        A project is a collection of StoryBook builds and tags. One project
        corresponds to one StoryBook instance/project.
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function ProjectUpdatePage({
  project,
}: {
  project: ProjectType;
}): JSXElement {
  const title = `Update Project`;
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectsList(), label: "Projects" },
          { href: urlBuilder.projectDetails(project.id), label: project.name },
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
