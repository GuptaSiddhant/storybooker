// oxlint-disable sort-keys
// oxlint-disable max-lines-per-function

import type { BuildType } from "#builds/schema";
import { ErrorMessage } from "#components/error-message";
import { CONTENT_TYPES } from "#utils/constants";
import { urlBuilder } from "#utils/url-builder";

export interface BuildFormProps {
  projectId: string;
  build: BuildType | undefined;
  labelSlug?: string;
}

export function BuildForm({
  projectId,
  labelSlug,
}: BuildFormProps): JSX.Element {
  return (
    <form
      hx-ext="response-targets"
      hx-post={urlBuilder.allBuilds(projectId)}
      hx-target-error="#form-error"
      style={{ maxWidth: "60ch" }}
      enctype={CONTENT_TYPES.FORM_ENCODED}
    >
      <fieldset>
        <legend>Details</legend>

        <div class="field">
          <label for="sha">SHA</label>
          <input id="sha" name="sha" required />
        </div>

        <div class="field">
          <label for="message">Message</label>
          <input id="message" name="message" />
        </div>
      </fieldset>

      <fieldset>
        <legend>Author</legend>

        <div class="field">
          <label for="authorName">Name</label>
          <input id="authorName" name="authorName" required />
        </div>
        <div class="field">
          <label for="authorEmail">Email</label>
          <input id="authorEmail" name="authorEmail" required />
        </div>
      </fieldset>

      <fieldset>
        <legend>Labels</legend>

        {Array.from({ length: 4 }).map((_, i) => {
          const id = `label-${i}`;
          return (
            <div class="field">
              <label for={id}>Label {i + 1}</label>
              <input
                id={id}
                name="labels"
                required={i === 0}
                value={i === 0 ? labelSlug : undefined}
              />
              {i === 0 ? <span class="description">Required</span> : null}
            </div>
          );
        })}
      </fieldset>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit">Upload build</button>
        <button type="reset">Reset</button>
      </div>

      <ErrorMessage id="form-error" />
    </form>
  );
}
