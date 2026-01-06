import type { RenderedContent } from "storybooker/adapter/ui";
import { WEBHOOK_EVENTS } from "storybooker/constants";
import type { ProjectType, WebhookType } from "storybooker/types";
import { DestructiveButton, LinkButton } from "../components/button.tsx";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document.tsx";
import { RawDataList } from "../components/raw-data.tsx";
import { confirmDelete } from "../utils/text-utils.ts";
import { getUIStore } from "../utils/ui-store.ts";

export function WebhookDetailsPage({
  project,
  webhook,
}: {
  project: ProjectType;
  webhook: WebhookType;
}): RenderedContent {
  const { urlBuilder } = getUIStore();

  const deleteUrl = urlBuilder.webhookDelete(project.id, webhook.id);
  const testUrl = urlBuilder.webhookTest(project.id, webhook.id);

  return (
    <DocumentLayout title={`Webhook ${webhook.id}`}>
      <DocumentHeader
        breadcrumbs={[
          { label: project.name, href: urlBuilder.projectDetails(project.id) },
          { label: "Webhooks", href: urlBuilder.webhooksList(project.id) },
        ]}
        toolbar={
          <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
            <LinkButton href={urlBuilder.webhookUpdate(project.id, webhook.id)}>Edit</LinkButton>
            <form hx-post={testUrl}>
              <input type="hidden" name="event" value={webhook.events?.[0] ?? WEBHOOK_EVENTS[0]} />
              <input type="hidden" name="payload" value={"test-payload"} />
              <input
                type="hidden"
                name="redirect"
                value={urlBuilder.webhookDetails(project.id, webhook.id)}
              />
              <button>Test</button>
            </form>
            <form
              method="post"
              action={deleteUrl}
              hx-post={deleteUrl}
              hx-confirm={confirmDelete("Webhook", webhook.id)}
            >
              <DestructiveButton>Delete</DestructiveButton>
            </form>
          </div>
        }
      >
        {webhook.id}
      </DocumentHeader>

      <DocumentMain>{""}</DocumentMain>

      <DocumentSidebar style={{ padding: "1rem" }}>
        <RawDataList data={webhook} />
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
