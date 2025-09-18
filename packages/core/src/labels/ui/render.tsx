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
import { RawDataList } from "#components/raw-data";
import type { LabelType } from "#labels/schema";
import type { ProjectType } from "#projects/schema";
import { getStore } from "#store";
import { urlBuilder } from "#urls";
import { commonT } from "#utils/i18n";
import { LabelForm } from "./label-form";
import { LabelsTable } from "./labels-table";

export function renderLabelsPage({
  labels,
  project,
}: {
  labels: LabelType[];
  project: ProjectType;
}): JSX.Element {
  const title = `${commonT.All()} ${commonT.Labels()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[project.name]}
        toolbar={
          <LinkButton href={urlBuilder.labelCreate(project.id)}>
            + {commonT.Create()}
          </LinkButton>
        }
      >
        {title}
      </DocumentHeader>
      <DocumentMain>
        <LabelsTable caption={""} project={project} labels={labels} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
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
    <DocumentLayout title={`${commonT.Label()} ${label.value}`}>
      <DocumentHeader
        breadcrumbs={[project.name, commonT.Labels()]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.buildCreate(project.id, label.id)}>
              + {commonT.Create()} {commonT.Build()}
            </LinkButton>
            <LinkButton href={urlBuilder.labelSlugUpdate(project.id, label.id)}>
              {commonT.Edit()}
            </LinkButton>
            <form
              hx-delete={url}
              hx-confirm={commonT.confirmDelete(commonT.Label(), label.slug)}
            >
              <DestructiveButton>{commonT.Delete()}</DestructiveButton>
            </form>
          </div>
        }
      >{`[${label.type}] ${label.value}`}</DocumentHeader>
      <DocumentMain>
        <BuildsTable
          builds={builds}
          project={project}
          labels={undefined}
          toolbar={
            <a href={urlBuilder.allBuilds(project.id)}>{commonT.ViewAll()}</a>
          }
        />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <RawDataList data={label} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}

export function renderLabelCreatePage({
  project,
}: {
  project: ProjectType;
}): JSX.Element {
  const title = `${commonT.Create()} ${commonT.Label()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectId(project.id), label: project.name },
          { href: urlBuilder.allLabels(project.id), label: commonT.Labels() },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <LabelForm label={undefined} projectId={project.id} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
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
  const title = `${commonT.Update()} ${commonT.Label()}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectId(projectId), label: projectId },
          { href: urlBuilder.allLabels(projectId), label: commonT.Labels() },
          { href: urlBuilder.labelSlug(projectId, label.id), label: label.id },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <LabelForm label={label} projectId={projectId} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
