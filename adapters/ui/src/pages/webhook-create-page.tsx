import type { RenderedContent } from "storybooker/adapter/ui";
import type { ProjectType } from "storybooker/types";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document.tsx";
import { WebhookForm } from "../components/webhook-form.tsx";
import { getUIStore } from "../utils/ui-store.ts";

export function WebhookCreatePage({ project }: { project: ProjectType }): RenderedContent {
  const title = "Create Webhook";
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectDetails(project.id), label: project.name },
          { href: urlBuilder.webhooksList(project.id), label: "Webhooks" },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <WebhookForm webhook={undefined} projectId={project.id} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
