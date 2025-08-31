import { BuildsTable } from "#builds-ui/builds-table";
import type { BuildType } from "#builds/schema";
import { DestructiveButton, LinkButton } from "#components/button";
import { DocumentLayout } from "#components/document";
import { RawDataPreview } from "#components/raw-data";
import type { LabelType } from "#labels/schema";
import type { ProjectType } from "#projects/schema";
import { getStore } from "#store";
import { urlBuilder } from "#urls";
import { LabelForm } from "./label-form";
import { LabelsTable } from "./labels-table";

export function renderLabelsPage({
  labels,
  project,
}: {
  labels: LabelType[];
  project: ProjectType;
}): JSX.Element {
  return (
    <DocumentLayout
      title="All Labels"
      breadcrumbs={[project.name]}
      toolbar={
        <LinkButton href={urlBuilder.labelCreate(project.id)}>
          + Create
        </LinkButton>
      }
      style={{ padding: 0 }}
    >
      <LabelsTable caption={""} project={project} labels={labels} />
    </DocumentLayout>
  );
}

export function renderLabelDetailsPage({
  label,
  project,
  builds,
}: {
  label: LabelType;
  project: ProjectType;
  builds: BuildType[];
}): JSX.Element {
  const { url } = getStore();

  return (
    <DocumentLayout
      title={`[${label.type}] ${label.value}`}
      breadcrumbs={[project.name, "Labels"]}
      toolbar={
        <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
          <LinkButton href={urlBuilder.buildCreate(project.id, label.id)}>
            + Create build
          </LinkButton>
          <form
            hx-delete={url}
            hx-confirm="Are you sure about deleting the build?"
          >
            <DestructiveButton>Delete</DestructiveButton>
          </form>
        </div>
      }
      style={{ padding: 0 }}
      sidebar={<RawDataPreview data={label} open />}
    >
      <BuildsTable
        builds={builds}
        project={project}
        labels={undefined}
        toolbar={<a href={urlBuilder.allBuilds(project.id)}>View all</a>}
      />
    </DocumentLayout>
  );
}

export function renderLabelCreatePage({
  project,
}: {
  project: ProjectType;
}): JSX.Element {
  return (
    <DocumentLayout
      title="Create Label"
      breadcrumbs={[
        { href: urlBuilder.projectId(project.id), label: project.name },
        { href: urlBuilder.allLabels(project.id), label: "Labels" },
      ]}
    >
      <LabelForm label={undefined} projectId={project.id} />
    </DocumentLayout>
  );
}

export function renderLabelUpdatePage({
  label,
  projectId,
}: {
  label: LabelType;
  projectId: string;
}): JSX.Element {
  return (
    <DocumentLayout
      title="Update Label"
      breadcrumbs={[
        { href: urlBuilder.projectId(projectId), label: projectId },
        { href: urlBuilder.allLabels(projectId), label: "Labels" },
        { href: urlBuilder.labelSlug(projectId, label.id), label: label.id },
      ]}
    >
      <LabelForm label={label} projectId={projectId} />
    </DocumentLayout>
  );
}
