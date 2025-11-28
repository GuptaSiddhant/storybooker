import {
  DEFAULT_GITHUB_BRANCH,
  DEFAULT_PURGE_AFTER_DAYS,
  PATTERNS,
} from "@storybooker/core/constants";
import type { ProjectType } from "@storybooker/core/types";
import { LinkButton } from "../components/button";
import { ErrorMessage } from "../components/error-message";
import { getUIStore } from "../utils/ui-store";

export interface ProjectsFormProps {
  project: ProjectType | undefined;
}

export function ProjectForm({ project }: ProjectsFormProps): JSXElement {
  const { url, urlBuilder } = getUIStore();

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

        {project?.id ? null : (
          <div class="field">
            <label for="id">Project ID</label>
            <input
              id="id"
              name="id"
              pattern={PATTERNS.projectId.pattern}
              required
            />
            <span class="description">
              Only lowercase alphabets, numbers and hyphen (-) allowed. Max
              length: 60 chars
            </span>
          </div>
        )}

        <div class="field">
          <label for="name">Project Name</label>
          <input id="name" name="name" required value={project?.name} />
        </div>
      </fieldset>

      <fieldset>
        <legend>GitHub</legend>

        <div class="field">
          <label for="gitHubRepository">Repo name</label>
          <input
            id="gitHubRepository"
            name="gitHubRepository"
            placeholder="owner/repo"
            required
            pattern="^.+\/.+$"
            value={project?.gitHubRepository}
          />
        </div>

        <div class="field">
          <label for="gitHubPath">Instance path</label>
          <input
            id="gitHubPath"
            name="gitHubPath"
            placeholder="packages/ui"
            value={project?.gitHubPath}
          />
          <span class={"description"}>
            Optional. If the Storybook is not is the root of repo.
          </span>
        </div>

        <div class="field">
          <label for="gitHubDefaultBranch">Default branch</label>
          <input
            id="gitHubDefaultBranch"
            name="gitHubDefaultBranch"
            placeholder="main"
            value={project?.gitHubDefaultBranch || DEFAULT_GITHUB_BRANCH}
          />
          <span class={"description"}>
            Optional. If the default branch is not 'main'.
          </span>
        </div>
      </fieldset>

      <fieldset>
        <legend>Jira</legend>

        <div class="field">
          <label for="jiraDomain">Jira Domain</label>
          <input
            id="jiraDomain"
            name="jiraDomain"
            placeholder="https://company.jira.net"
            value={project?.jiraDomain}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Purge</legend>
        <div class="field">
          <label for="purgeBuildsAfterDays">Purge builds after days</label>
          <input
            id="purgeBuildsAfterDays"
            name="purgeBuildsAfterDays"
            required
            type="number"
            inputmode="numeric"
            value={(
              project?.purgeBuildsAfterDays || DEFAULT_PURGE_AFTER_DAYS
            ).toString()}
          />
          <span class={"description"} safe>
            Days after which the builds in the project should be purged.
          </span>
        </div>
      </fieldset>

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit">{project ? "Update" : "Create"} Project</button>
        <button type="reset">Reset</button>
        <LinkButton
          href={
            project
              ? urlBuilder.projectDetails(project.id)
              : urlBuilder.projectsList()
          }
        >
          Cancel
        </LinkButton>
      </div>

      <ErrorMessage id="form-error" />
    </form>
  );
}
