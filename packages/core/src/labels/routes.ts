import { BuildsModel } from "#builds/model";
import { CONTENT_TYPES } from "#constants";
import {
  renderLabelCreatePage,
  renderLabelDetailsPage,
  renderLabelEditPage,
  renderLabelsPage,
} from "#labels-ui/render";
import { ProjectsModel } from "#projects/model";
import { defineRoute } from "#utils/api-router";
import { authenticateOrThrow } from "#utils/auth";
import {
  checkIsHTMLRequest,
  checkIsHXRequest,
  checkIsNewMode,
  validateIsFormEncodedRequest,
} from "#utils/request";
import {
  commonErrorResponses,
  responseError,
  responseHTML,
  responseRedirect,
} from "#utils/response";
import { LabelSlugSchema, ProjectIdSchema } from "#utils/shared-model";
import { urlSearchParamsToObject } from "#utils/url";
import { urlBuilder } from "#utils/url-builder";
import z from "zod";
import { LabelsModel } from "./model";
import {
  LabelCreateSchema,
  LabelsGetResultSchema,
  LabelsListResultSchema,
  LabelUpdateSchema,
  type LabelsGetResultType,
  type LabelsListResultType,
} from "./schema";

const tag = "Labels";

export const listLabels = defineRoute(
  "get",
  "/:projectId/labels",
  {
    requestParams: {
      path: z.object({ projectId: ProjectIdSchema }),
    },
    responses: {
      ...commonErrorResponses,
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
          [CONTENT_TYPES.JSON]: { schema: LabelsListResultSchema },
        },
        description: "A list of labels.",
      },
    },
    summary: "List all labels for a project",
    tags: [tag],
  },
  async ({ params: { projectId } }) => {
    if (checkIsNewMode()) {
      await authenticateOrThrow([
        { action: "create", projectId, resource: "label" },
      ]);
      const project = await new ProjectsModel().get(projectId);

      return responseHTML(renderLabelCreatePage({ project }));
    }

    await authenticateOrThrow([
      { action: "read", projectId, resource: "label" },
    ]);

    const labels = await new LabelsModel(projectId).list();

    if (checkIsHTMLRequest()) {
      const project = await new ProjectsModel().get(projectId);
      return responseHTML(renderLabelsPage({ labels, project }));
    }

    const result: LabelsListResultType = { labels };
    return Response.json(result);
  },
);

export const createLabel = defineRoute(
  "post",
  "/:projectId/labels",
  {
    requestBody: {
      content: { [CONTENT_TYPES.FORM_ENCODED]: { schema: LabelCreateSchema } },
      description: "Data about the label",
      required: true,
    },
    requestParams: { path: z.object({ projectId: ProjectIdSchema }) },
    responses: {
      ...commonErrorResponses,
      201: {
        content: {
          [CONTENT_TYPES.JSON]: { schema: LabelsGetResultSchema },
        },
        description: "Label created successfully",
      },
      303: {
        description: "Label created, redirecting...",
        headers: { Location: z.url() },
      },
      415: { description: "Unsupported Media Type" },
    },
    summary: "Create a new label",
    tags: [tag],
  },
  async ({ params: { projectId }, request }) => {
    const projectModel = new ProjectsModel().id(projectId);
    if (!(await projectModel.has())) {
      return responseError(`The project '${projectId}' does not exist.`, 404);
    }

    const validFormError = validateIsFormEncodedRequest(request);
    if (validFormError) {
      return responseError(validFormError.message, validFormError.status);
    }

    await authenticateOrThrow([
      { action: "create", projectId, resource: "label" },
    ]);

    const label = await new LabelsModel(projectId).create(
      urlSearchParamsToObject(await request.formData()),
    );

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.labelSlug(projectId, label.id), 303);
    }

    const result: LabelsGetResultType = { label };
    return Response.json(result, { status: 201 });
  },
);

export const getLabel = defineRoute(
  "get",
  "/:projectId/labels/:labelSlug",
  {
    requestParams: {
      path: z.object({
        labelSlug: LabelSlugSchema,
        projectId: ProjectIdSchema,
      }),
    },
    responses: {
      ...commonErrorResponses,
      200: {
        content: {
          [CONTENT_TYPES.JSON]: { schema: LabelsGetResultSchema },
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
        },
        description: "Label details retrieved successfully",
      },
    },
    summary: "Get label details",
    tags: [tag],
  },
  async ({ params: { labelSlug, projectId } }) => {
    await authenticateOrThrow([
      { action: "read", projectId, resource: "label" },
    ]);

    const label = await new LabelsModel(projectId).get(labelSlug);

    if (checkIsNewMode()) {
      await authenticateOrThrow([
        { action: "update", projectId, resource: "label" },
      ]);

      return responseHTML(renderLabelEditPage({ label, projectId }));
    }

    if (checkIsHTMLRequest()) {
      const project = await new ProjectsModel().get(projectId);
      const builds = await new BuildsModel(projectId).listByLabel(label.id);

      return responseHTML(renderLabelDetailsPage({ builds, label, project }));
    }

    const result: LabelsGetResultType = { label };
    return Response.json(result);
  },
);

export const deleteLabel = defineRoute(
  "delete",
  "/:projectId/labels/:labelSlug",
  {
    requestParams: {
      path: z.object({
        labelSlug: LabelSlugSchema,
        projectId: ProjectIdSchema,
      }),
    },
    responses: {
      ...commonErrorResponses,
      204: { description: "Label deleted successfully" },
      303: {
        description: "Label deleted, redirecting...",
        headers: { Location: z.url() },
      },
      404: { description: "Label not found" },
    },
    summary: "Delete label",
    tags: [tag],
  },
  async ({ params: { labelSlug, projectId } }) => {
    await authenticateOrThrow([
      { action: "delete", projectId, resource: "label" },
    ]);

    await new LabelsModel(projectId).delete(labelSlug);

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.allLabels(projectId), 303);
    }

    return new Response(null, { status: 204 });
  },
);

export const updateLabel = defineRoute(
  "patch",
  "/:projectId/labels/:labelSlug",
  {
    requestBody: {
      content: {
        [CONTENT_TYPES.FORM_ENCODED]: { schema: LabelUpdateSchema },
      },
      description: "Updated label data",
      required: true,
    },
    requestParams: {
      path: z.object({
        labelSlug: LabelSlugSchema,
        projectId: ProjectIdSchema,
      }),
    },
    responses: {
      ...commonErrorResponses,
      202: { description: "Label updated successfully" },
      303: {
        description: "Label updated, redirecting...",
        headers: { Location: z.url() },
      },
      404: { description: "Matching project or label not found." },
      415: { description: "Unsupported Media Type" },
    },
    summary: "Update label details",
    tags: [tag],
  },
  async ({ params: { labelSlug, projectId }, request }) => {
    await authenticateOrThrow([
      { action: "update", projectId, resource: "label" },
    ]);

    const validFormError = validateIsFormEncodedRequest(request);
    if (validFormError) {
      return responseError(validFormError.message, validFormError.status);
    }

    await new LabelsModel(projectId).update(
      labelSlug,
      urlSearchParamsToObject(await request.formData()),
    );

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(request.url, 303);
    }

    return new Response(null, { status: 202 });
  },
);
