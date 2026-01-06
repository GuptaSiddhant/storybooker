import { WEBHOOK_EVENTS } from "storybooker/constants";
import type { WebhookType } from "storybooker/types";
import { getUIStore } from "../utils/ui-store.ts";
import { LinkButton } from "./button.tsx";
import { ErrorMessage } from "./error-message.tsx";

export interface WebhookFormProps {
  projectId: string;
  webhook: WebhookType | undefined;
}

export function WebhookForm({ webhook, projectId }: WebhookFormProps): JSXElement {
  const { urlBuilder } = getUIStore();
  const actionUrl = webhook
    ? urlBuilder.webhookUpdate(projectId, webhook.id)
    : urlBuilder.webhookCreate(projectId);

  return (
    <form
      method="post"
      action={actionUrl}
      hx-ext="response-targets"
      hx-post={actionUrl}
      hx-target-error="#form-error"
      style={{ maxWidth: "60ch" }}
    >
      <fieldset>
        <legend>Details</legend>

        {webhook?.id ? null : (
          <div class="field">
            <label for="id">Webhook ID</label>
            <input id="id" name="id" required />
            <span class="description">
              Only lowercase alphabets, numbers and hyphen (-) allowed. Max length: 60 chars
            </span>
          </div>
        )}

        <div class="field">
          <label for="url">Webhook URL</label>
          <input
            id="url"
            name="url"
            required
            value={webhook?.url ?? "https://"}
            type="url"
            autocomplete={"off"}
            autocapitalize="off"
            translate="no"
            placeholder="https://"
          />
          <span class="description">
            The URL to which the webhook payloads will be delivered via HTTP POST requests.
          </span>
        </div>

        <div class="field">
          <label for="secret">Webhook Secret</label>
          <input
            id="secret"
            name="secret"
            required
            value={webhook?.secret}
            autocomplete={"off"}
            autocapitalize="off"
            translate="no"
          />
          <span class="description">
            The secret will be used to generate HMAC SHA256 signature for each webhook request. It
            will added to `x-webhook-signature` header.
          </span>
        </div>
      </fieldset>

      <fieldset>
        <legend>Events</legend>
        <span class="description">
          Select events on which the webhook should be triggered. Not selecting any event will
          enable webhook for all events.
        </span>

        <div
          style={{
            display: "grid",
            colGap: "0.5rem",
            gridTemplateColumns: "repeat(3,1fr)",
          }}
        >
          {WEBHOOK_EVENTS.map((event) => {
            const id = `event-${event}`;
            return (
              <div style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
                <input id={id} name="events" type="checkbox" value={event} />
                <label for={id}>{event}</label>
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* <fieldset>
        <legend>Headers</legend>
        <span class="description">
          Add custom headers to be sent with each webhook request. The entries will be encrypted
          while storing in the database.
        </span>
        {Array.from({ length: 3 }).map((_ignore, index) => {
          const id = `headers.${index}`;
          const nameInputId = `${id}.name`;
          const valueInputId = `${id}.value`;

          return (
            <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "1fr 2fr" }}>
              <div class="field">
                <label for={nameInputId}>Name</label>
                <input
                  id={nameInputId}
                  name={nameInputId}
                  value={index === 0 ? "Authorization" : undefined}
                />
              </div>
              <div class="field">
                <label for={valueInputId}>Value</label>
                <input id={valueInputId} name={valueInputId} />
              </div>
            </div>
          );
        })}
      </fieldset> */}

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit">{webhook ? "Update" : "Create"} Webhook</button>
        <button type="reset">Reset</button>
        <LinkButton
          href={
            webhook
              ? urlBuilder.webhookDetails(projectId, webhook.id)
              : urlBuilder.webhooksList(projectId)
          }
        >
          Cancel
        </LinkButton>
      </div>

      <ErrorMessage id="form-error" />
    </form>
  );
}
