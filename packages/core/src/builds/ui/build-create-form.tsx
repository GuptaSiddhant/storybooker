// oxlint-disable sort-keys
// oxlint-disable max-lines-per-function

import { LinkButton } from "../../components/button";
import { ErrorMessage } from "../../components/error-message";
import { urlBuilder } from "../../urls";
import { CONTENT_TYPES } from "../../utils/constants";
import { commonT } from "../../utils/i18n";
import { getStore } from "../../utils/store";

export interface BuildFormProps {
  projectId: string;
  tagSlug?: string;
}

export function BuildCreateForm({
  projectId,
  tagSlug,
}: BuildFormProps): JSX.Element {
  const { url } = getStore();

  return (
    <form
      method="post"
      hx-ext="response-targets"
      hx-post={url}
      hx-target-error="#form-error"
      style={{ maxWidth: "60ch" }}
      enctype={CONTENT_TYPES.FORM_ENCODED}
    >
      <fieldset>
        <legend>{commonT.Details()}</legend>

        <div class="field">
          <label for="sha">SHA</label>
          <input id="sha" name="sha" required />
        </div>

        <div class="field">
          <label for="message">{commonT.Message()}</label>
          <input id="message" name="message" />
        </div>
      </fieldset>

      <fieldset>
        <legend>{commonT.Author()}</legend>

        <div class="field">
          <label for="authorName">{commonT.Name()}</label>
          <input id="authorName" name="authorName" required />
        </div>
        <div class="field">
          <label for="authorEmail">{commonT.Email()}</label>
          <input id="authorEmail" name="authorEmail" required />
        </div>
      </fieldset>

      <fieldset>
        <legend>{commonT.Tags()}</legend>

        {Array.from({ length: 4 }).map((_ignore, index) => {
          const id = `tag-${index}`;
          return (
            <div class="field">
              <label for={id}>
                {commonT.Tag()} {index + 1}
              </label>
              <input
                id={id}
                name="tags"
                required={index === 0}
                value={index === 0 ? tagSlug : undefined}
              />
              {index === 0 ? (
                <span class="description">{commonT.Required()}</span>
              ) : null}
            </div>
          );
        })}
      </fieldset>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit">
          {commonT.Create()} {commonT.Build()}
        </button>
        <button type="reset">{commonT.Reset()}</button>
        <LinkButton href={urlBuilder.allBuilds(projectId)}>
          {commonT.Cancel()}
        </LinkButton>
      </div>

      <ErrorMessage id="form-error" />
    </form>
  );
}
