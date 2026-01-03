import type { ProjectType, WebhookType } from "storybooker/_internal/types";
import { getUIStore } from "../utils/ui-store.ts";
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
          id: "events",
          header: "Events",
          style: { fontFamily: "monospace", fontSize: "0.9em" },
          cell: (item) => {
            return <span>{item.events?.map((event) => <span>{event}</span>) || null}</span>;
          },
        },
        {
          id: "actions",
          header: "Actions",
          cell: (item) => {
            return <a href={urlBuilder.webhookDetails(project.id, item.id)}>View builds</a>;
          },
        },
      ]}
    />
  );
}
