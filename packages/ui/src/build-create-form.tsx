import { getStore } from "@storybooker/core/store";
import { urlBuilder } from "@storybooker/core/url";
import { LinkButton } from "./components/button";
import { ErrorMessage } from "./components/error-message";
import { commonT } from "./translations/i18n";

export interface BuildFormProps {
  projectId: string;
  tagId?: string;
}

export function BuildCreateForm({
  projectId,
  tagId,
}: BuildFormProps): JSXElement {
  const { url } = getStore();

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
        <legend>{commonT.Details()}</legend>

        <div class="field">
          <label for="id">ID / SHA</label>
          <input id="id" name="id" required />
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
                value={index === 0 ? tagId : undefined}
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
        <LinkButton href={urlBuilder.buildsList(projectId)}>
          {commonT.Cancel()}
        </LinkButton>
      </div>

      <ErrorMessage id="form-error" />
    </form>
  );
}
