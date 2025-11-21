import type { BuildType } from "../models/builds-schema";
import type { ProjectType } from "../models/projects-schema";
import type { TagType } from "../models/tags-schema";
import { TagsTable } from "../ui/tags-table";
import { urlBuilder } from "../urls";
import { BuildsTable } from "./builds-table";
import { DestructiveButton, LinkButton } from "./components/button";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "./components/document";
import { RawDataList } from "./components/raw-data";
import { ProjectForm } from "./project-form";
import { ProjectsTable } from "./projects-table";
import { commonT, getT } from "./translations/i18n";

export function ProjectsPage({
  projects,
}: {
  projects: ProjectType[];
}): JSXElement {
  const title = `${commonT.All()} ${commonT.Projects()}`;
  const purgeUrl = urlBuilder.taskPurge();

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
              method="post"
              action={purgeUrl}
              hx-post={purgeUrl}
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
      <DocumentSidebar style={{ padding: "1rem" }}>
        <a href={urlBuilder.projectCreate()}>
          {commonT.Create()} {commonT.Project()}
        </a>
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
  const deleteUrl = urlBuilder.projectDelete(project.id);
  const purgeUrl = urlBuilder.taskPurge(project.id);

  return (
    <DocumentLayout title={project.name}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectsList(), label: commonT.Projects() },
        ]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.buildCreate(project.id)}>
              + {commonT.Create()} {commonT.Build()}
            </LinkButton>
            <LinkButton href={urlBuilder.projectUpdate(project.id)}>
              {commonT.Edit()}
            </LinkButton>
            <form
              method="post"
              action={purgeUrl}
              hx-post={purgeUrl}
              hx-confirm={commonT.confirmPurge()}
            >
              <DestructiveButton>{commonT.Purge()}</DestructiveButton>
            </form>
            <form
              method="post"
              action={deleteUrl}
              hx-post={deleteUrl}
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
        <TagsTable
          tags={recentTags}
          project={project}
          caption={`${commonT.Recent()} ${commonT.Tags()}`}
          toolbar={
            <a href={urlBuilder.tagsList(project.id)}>{commonT.ViewAll()}</a>
          }
        />
        <BuildsTable
          builds={recentBuilds}
          tags={recentTags}
          project={project}
          caption={`${commonT.Recent()} ${commonT.Builds()}`}
          toolbar={
            <a href={urlBuilder.buildsList(project.id)}>{commonT.ViewAll()}</a>
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

export function ProjectCreatePage(): JSXElement {
  const title = `${commonT.Create()} ${commonT.Project()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectsList(), label: commonT.Projects() },
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

export function ProjectUpdatePage({
  project,
}: {
  project: ProjectType;
}): JSXElement {
  const title = `${commonT.Update()} ${commonT.Project()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectsList(), label: commonT.Projects() },
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
