import { TagTypes } from "@storybooker/core/constants";
import { getStore } from "@storybooker/core/store";
import type { TagType } from "@storybooker/core/types";
import { urlBuilder } from "@storybooker/core/url";
import { LinkButton } from "../components/button";
import { ErrorMessage } from "../components/error-message";

export interface TagFormProps {
  tag: TagType | undefined;
  projectId: string;
}

export function TagForm({ tag, projectId }: TagFormProps): JSXElement {
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
        <legend>Details</legend>

        {tag ? <input type="hidden" name="id" value={tag.id} /> : null}

        <div class="field">
          <label for="value">Tags</label>
          <input id="value" name="value" required value={tag?.value} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Variant/Type</legend>

        <div
          style={{
            display: "grid",
            gap: "0.5rem",
            gridTemplateColumns: "repeat(3,1fr)",
          }}
        >
          {TagTypes.map((type) => {
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
                  checked={type === tag?.type}
                />
                <label for={id}>{type}</label>
              </div>
            );
          })}
        </div>

        <span class="description">
          Type of tag defines behaviour of the tag.
        </span>
      </fieldset>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit">{tag ? "Update" : "Create"} Tags</button>
        <button type="reset">Reset</button>
        <LinkButton
          href={
            tag
              ? urlBuilder.tagDetails(projectId, tag.id)
              : urlBuilder.tagsList(projectId)
          }
        >
          Cancel
        </LinkButton>
      </div>

      <ErrorMessage id="form-error" />
    </form>
  );
}
