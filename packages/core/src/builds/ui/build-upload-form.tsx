// oxlint-disable sort-keys
// oxlint-disable max-lines-per-function

import {
  buildUploadVariants,
  type BuildType,
  type BuildUploadVariant,
} from "../../builds/schema";
import { LinkButton } from "../../components/button";
import { ErrorMessage } from "../../components/error-message";
import { urlBuilder } from "../../urls";
import { CONTENT_TYPES } from "../../utils/constants";
import { commonT } from "../../utils/i18n";
import { getStore } from "../../utils/store";

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
        <legend>{commonT.Variant()}</legend>

        <div
          style={{
            display: "flex",
            columnGap: "2rem",
            flexWrap: "wrap",
          }}
        >
          {buildUploadVariants.map((variant) => {
            const id = `variant-${variant}`;
            const disabled = checkIsVariantDisabled(build, variant);

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
                  disabled={disabled}
                />
                <label for={id} style={{ opacity: disabled ? 0.5 : undefined }}>
                  {variant}
                </label>
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
        <button type="submit">{commonT.Upload()} file</button>
        <button type="reset">{commonT.Reset()}</button>
        <LinkButton href={urlBuilder.buildSHA(projectId, build.id)}>
          {commonT.Cancel()}
        </LinkButton>
      </div>

      <ErrorMessage id="form-error" />
    </form>
  );
}

function checkIsVariantDisabled(build: BuildType, variant: BuildUploadVariant) {
  switch (variant) {
    case "coverage": {
      return build.hasCoverage;
    }
    case "screenshots": {
      return build.hasScreenshots;
    }
    case "storybook": {
      return build.hasStorybook;
    }
    case "testReport": {
      return build.hasTestReport;
    }
    default: {
      return false;
    }
  }
}
