// oxlint-disable sort-keys
// oxlint-disable max-lines-per-function

import {
  buildUploadVariants,
  type BuildType,
  type BuildUploadVariant,
} from "#builds/schema";
import { LinkButton } from "#components/button";
import { ErrorMessage } from "#components/error-message";
import { getStore } from "#store";
import { CONTENT_TYPES } from "#utils/constants";
import { urlBuilder } from "#utils/url-builder";

export interface BuildUploadFormProps {
  build: BuildType;
  projectId: string;
  uploadVariant?: BuildUploadVariant;
}

export function BuildUploadForm({
  build,
  projectId,
  uploadVariant,
}: BuildUploadFormProps): JSX.Element {
  const { url } = getStore();

  return (
    <form
      method="post"
      hx-ext="response-targets"
      hx-post={url}
      hx-target-error="#form-error"
      style={{ maxWidth: "60ch" }}
      enctype={CONTENT_TYPES.FORM_MULTIPART}
    >
      <fieldset>
        <legend>Variant</legend>

        <div
          style={{
            display: "grid",
            gap: "0.5rem",
            gridTemplateColumns: "repeat(3,1fr)",
          }}
        >
          {buildUploadVariants.map((variant) => {
            const id = `variant-${variant}`;
            return (
              <div
                style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}
              >
                <input
                  id={id}
                  name="variant"
                  type="radio"
                  required
                  value={variant}
                  checked={variant === uploadVariant}
                />
                <label for={id}>{variant}</label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Zip file</legend>
        <input
          type="file"
          name="file"
          accept={CONTENT_TYPES.ZIP}
          multiple={false}
        />
      </fieldset>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit">Upload file</button>
        <button type="reset">Reset</button>
        <LinkButton href={urlBuilder.buildSHA(projectId, build.id)}>
          Cancel
        </LinkButton>
      </div>

      <ErrorMessage id="form-error" />
    </form>
  );
}
