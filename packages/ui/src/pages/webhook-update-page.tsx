import type { RenderedContent } from "storybooker/_internal/adapter/ui";
import type { ProjectType, WebhookType } from "storybooker/_internal/types";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document.tsx";
import { WebhookForm } from "../components/webhook-form.tsx";
import { getUIStore } from "../utils/ui-store.ts";

export function WebhookUpdatePage({
  project,
  webhook,
}: {
  project: ProjectType;
  webhook: WebhookType;
}): RenderedContent {
  const title = "Update Webhook";
  const { urlBuilder } = getUIStore();

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[
          { href: urlBuilder.projectDetails(project.id), label: project.name },
          { href: urlBuilder.webhooksList(project.id), label: "Webhooks" },
          { href: urlBuilder.webhookDetails(project.id, webhook.id), label: webhook.id },
        ]}
      >
        {title}
      </DocumentHeader>
      <DocumentMain style={{ padding: "1rem" }}>
        <WebhookForm webhook={webhook} projectId={project.id} />
      </DocumentMain>
      <DocumentSidebar></DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
