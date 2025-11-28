import { LinkButton } from "../components/button";
import { ErrorMessage } from "../components/error-message";
import { getUIStore } from "../utils/ui-store";

export interface BuildFormProps {
  projectId: string;
  tagId?: string;
}

export function BuildCreateForm({
  projectId,
  tagId,
}: BuildFormProps): JSXElement {
  const { url, urlBuilder } = getUIStore();

  return (
    <form
      method="post"
      hx-ext="response-targets"
      hx-post={url}
      hx-target-error="#form-error"
      style={{ maxWidth: "60ch" }}
      enctype={"application/x-www-form-urlencoded"}
    >
      <fieldset>
        <legend>Details</legend>

        <div class="field">
          <label for="id">ID / SHA</label>
          <input id="id" name="id" required />
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
        <legend>Tags</legend>

        {Array.from({ length: 4 }).map((_ignore, index) => {
          const id = `tag-${index}`;
          return (
            <div class="field">
              <label for={id}>Tag {index + 1}</label>
              <input
                id={id}
                name="tags"
                required={index === 0}
                value={index === 0 ? tagId : undefined}
              />
              {index === 0 ? <span class="description">Required</span> : null}
            </div>
          );
        })}
      </fieldset>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit">Create Build</button>
        <button type="reset">Reset</button>
        <LinkButton href={urlBuilder.buildsList(projectId)}>Cancel</LinkButton>
      </div>

      <ErrorMessage id="form-error" />
    </form>
  );
}
