import {
  buildUploadVariants,
  type BuildType,
  type BuildUploadVariant,
} from "../models/builds-schema";
import { urlBuilder } from "../urls";
import { mimes } from "../utils/mime-utils";
import { getStore } from "../utils/store";
import { LinkButton } from "./components/button";
import { ErrorMessage } from "./components/error-message";
import { commonT } from "./translations/i18n";

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
      enctype={mimes.formMultipart}
      hx-encoding={mimes.formMultipart}
      hx-disabled-elt="find button"
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
        <input type="file" name="file" accept={mimes.zip} multiple={false} />
      </fieldset>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit">{commonT.Upload()} file</button>
        <button type="reset">{commonT.Reset()}</button>
        <LinkButton href={urlBuilder.buildSHA(projectId, build.id)}>
          {commonT.Cancel()}
        </LinkButton>
      </div>

      <fieldset id="progress" style={{ display: "none" }}>
        <span>Uploading: 0%</span>
        <progress value="0" max="100" style={{ width: "100%" }}></progress>
      </fieldset>

      <ErrorMessage id="form-error" />
    </form>
  );
}

function checkIsVariantDisabled(build: BuildType, variant: BuildUploadVariant) {
  switch (variant) {
    case "coverage":
    case "screenshots":
    case "storybook":
    case "testReport": {
      return build[variant] !== "none";
    }

    default: {
      return false;
    }
  }
}
