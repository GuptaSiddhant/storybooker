import type { ProjectType, WebhookType } from "storybooker/types";
import { getUIStore } from "../utils/ui-store.ts";
import { Badge } from "./badge.tsx";
import { Table } from "./table.tsx";

export interface WebhooksTableProps {
  caption?: JSXChildren;
  project: ProjectType;
  toolbar?: JSXChildren;
  webhooks: WebhookType[];
}

export function WebhooksTable({
  webhooks,
  project,
  toolbar,
  caption,
}: WebhooksTableProps): JSXElement {
  const { locale, urlBuilder } = getUIStore();

  return (
    <Table
      caption={caption ?? `Webhooks (${webhooks.length})`}
      data={webhooks}
      toolbar={toolbar}
      columns={[
        {
          id: "updatedAt",
          header: "Updated at",
          cell: (item) => {
            if (!item.updatedAt) {
              return null;
            }

            return (
              <time datetime={item.updatedAt} safe>
                {new Date(item.updatedAt).toLocaleString(locale)}
              </time>
            );
          },
        },
        {
          id: "id",
          header: "ID",
          cell: (item) => {
            return <a href={urlBuilder.webhookDetails(project.id, item.id)}>{item.id}</a>;
          },
        },
        {
          id: "url",
          header: "URL",
        },
        {
          id: "events",
          header: "Events",
          cell: (item) => {
            return (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                {item.events && item.events.length > 0 ? (
                  item.events.map((event) => <Badge>{event}</Badge>)
                ) : (
                  <Badge>All events</Badge>
                )}
              </div>
            );
          },
        },
      ]}
    />
  );
}
