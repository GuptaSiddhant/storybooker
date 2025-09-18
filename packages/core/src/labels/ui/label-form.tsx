// oxlint-disable max-lines-per-function

import { LinkButton } from "#components/button";
import { ErrorMessage } from "#components/error-message";
import { labelTypes, type LabelType } from "#labels/schema";
import { getStore } from "#store";
import { urlBuilder } from "#urls";
import { commonT } from "#utils/i18n";

export interface LabelFormProps {
  label: LabelType | undefined;
  projectId: string;
}

export function LabelForm({ label, projectId }: LabelFormProps): JSX.Element {
  const { url } = getStore();

  return (
    <form
      method="post"
      hx-ext="response-targets"
      hx-post={url}
      hx-target-error="#form-error"
      style={{ maxWidth: "60ch" }}
    >
      <fieldset>
        <legend>{commonT.Details()}</legend>

        {label ? <input type="hidden" name="slug" value={label.slug} /> : null}

        <div class="field">
          <label for="value">{commonT.Label()}</label>
          <input id="value" name="value" required value={label?.value} />
        </div>
      </fieldset>

      <fieldset>
        <legend>{commonT.Type()}</legend>

        <div
          style={{
            display: "grid",
            gap: "0.5rem",
            gridTemplateColumns: "repeat(3,1fr)",
          }}
        >
          {labelTypes.map((type) => {
            const id = `type-${type}`;
            return (
              <div
                style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}
              >
                <input
                  id={id}
                  name="type"
                  type="radio"
                  required
                  value={type}
                  checked={type === label?.type}
                />
                <label for={id}>{type}</label>
              </div>
            );
          })}
        </div>

        <span class="description">
          Type of label defines behaviour of the label.
        </span>
      </fieldset>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit">
          {label ? commonT.Update() : commonT.Create()} {commonT.Label()}
        </button>
        <button type="reset">{commonT.Reset()}</button>
        <LinkButton
          href={
            label
              ? urlBuilder.labelSlug(projectId, label.slug)
              : urlBuilder.allLabels(projectId)
          }
        >
          {commonT.Cancel()}
        </LinkButton>
      </div>

      <ErrorMessage id="form-error" />
    </form>
  );
}
