import type { RenderedContent } from "storybooker/_internal/adapter/ui";
import { WEBHOOK_EVENTS } from "storybooker/_internal/constants";
import type { ProjectType, WebhookType, WebhookEvent } from "storybooker/_internal/types";
import { LinkButton } from "../components/button.tsx";
import {
  DocumentHeader,
  DocumentLayout,
  DocumentMain,
  DocumentSidebar,
  DocumentUserSection,
} from "../components/document.tsx";
import { WebhooksTable } from "../components/webhooks-table.tsx";
import { getUIStore } from "../utils/ui-store.ts";

export function WebhooksListPage({
  webhooks,
  project,
  defaultEvent,
}: {
  webhooks: WebhookType[];
  project: ProjectType;
  defaultEvent?: WebhookEvent | "" | null | undefined;
}): RenderedContent {
  const { urlBuilder } = getUIStore();

  const title = `All Webhooks ${defaultEvent ? `(${defaultEvent.toUpperCase()})` : ""}`;

  return (
    <DocumentLayout title={title}>
      <DocumentHeader
        breadcrumbs={[{ label: project.name, href: urlBuilder.projectDetails(project.id) }]}
        toolbar={<LinkButton href={urlBuilder.webhookCreate(project.id)}>+ Create</LinkButton>}
      >
        {title}
      </DocumentHeader>
      <DocumentMain>
        <WebhooksTable caption={""} project={project} webhooks={webhooks} />
      </DocumentMain>
      <DocumentSidebar style={{ padding: "1rem" }}>
        <form style={{ display: "flex", gap: "1rem" }}>
          <div class="field" style={{ minWidth: "100px" }}>
            <label for="filter-event">Event</label>
            <select id="filter-event" name="type">
              <option value="">All Events</option>
              {WEBHOOK_EVENTS.map((event) => (
                <option value={event} selected={defaultEvent === event}>
                  {event.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button style={{ height: "max-content" }}>Filter</button>
            <LinkButton href={urlBuilder.tagsList(project.id)} class="outline">
              Clear
            </LinkButton>
          </div>
        </form>
      </DocumentSidebar>
      <DocumentUserSection />
    </DocumentLayout>
  );
}
