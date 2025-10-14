// oxlint-disable max-lines

import z from "zod";
import { BuildsModel } from "../builds/model";
import {
  renderLabelCreatePage,
  renderLabelDetailsPage,
  renderLabelsPage,
  renderLabelUpdatePage,
} from "../labels/ui/render";
import { ProjectsModel } from "../projects/model";
import { urlBuilder, URLS } from "../urls";
import { authenticateOrThrow } from "../utils/auth";
import { CONTENT_TYPES } from "../utils/constants";
import {
  checkIsHTMLRequest,
  checkIsHXRequest,
  validateIsFormEncodedRequest,
} from "../utils/request";
import {
  commonErrorResponses,
  errorContent,
  responseError,
  responseHTML,
  responseRedirect,
} from "../utils/response";
import { defineRoute } from "../utils/router-utils";
import { LabelSlugSchema, ProjectIdSchema } from "../utils/shared-model";
import { urlSearchParamsToObject } from "../utils/url";
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
  URLS.labels.all,
  {
    requestParams: {
      path: z.object({ projectId: ProjectIdSchema }),
    },
    responses: {
      ...commonErrorResponses(),
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
  async ({ params: { projectId }, request }) => {
    await authenticateOrThrow({ action: "read", projectId, resource: "label" });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const labels = await new LabelsModel(projectId).list({
      filter: type ? (item): boolean => item.type === type : undefined,
    });

    if (checkIsHTMLRequest()) {
      const project = await new ProjectsModel().get(projectId);
      return await responseHTML(
        renderLabelsPage({ defaultType: type, labels, project }),
      );
    }

    const result: LabelsListResultType = { labels };
    return Response.json(result);
  },
);

export const createLabel = defineRoute(
  "post",
  URLS.labels.create,
  {
    requestBody: {
      content: { [CONTENT_TYPES.FORM_ENCODED]: { schema: LabelCreateSchema } },
      description: "Data about the label",
      required: true,
    },
    requestParams: { path: z.object({ projectId: ProjectIdSchema }) },
    responses: {
      ...commonErrorResponses(),
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
      409: { content: errorContent, description: "Label already exists." },
      415: { description: "Unsupported Media Type" },
    },
    summary: "Create a new label",
    tags: [tag],
  },
  async ({ params: { projectId }, request }) => {
    const projectModel = new ProjectsModel().id(projectId);
    if (!(await projectModel.has())) {
      return await responseError(
        `The project '${projectId}' does not exist.`,
        404,
      );
    }

    const validFormError = validateIsFormEncodedRequest(request);
    if (validFormError) {
      return await responseError(validFormError.message, validFormError.status);
    }

    await authenticateOrThrow({
      action: "create",
      projectId,
      resource: "label",
    });

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

export const createLabelForm = defineRoute(
  "get",
  URLS.labels.create,
  {
    responses: {
      ...commonErrorResponses(),
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
        },
        description: "Form to create label",
      },
    },
    summary: "Form to create label",
    tags: [tag],
  },
  async ({ params: { projectId } }) => {
    await authenticateOrThrow({
      action: "create",
      projectId: undefined,
      resource: "label",
    });
    const project = await new ProjectsModel().get(projectId);

    return await responseHTML(renderLabelCreatePage({ project }));
  },
);

export const getLabel = defineRoute(
  "get",
  URLS.labels.id,
  {
    requestParams: {
      path: z.object({
        labelSlug: LabelSlugSchema,
        projectId: ProjectIdSchema,
      }),
    },
    responses: {
      ...commonErrorResponses(),
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
    await authenticateOrThrow({ action: "read", projectId, resource: "label" });

    const label = await new LabelsModel(projectId).get(labelSlug);

    if (checkIsHTMLRequest()) {
      const project = await new ProjectsModel().get(projectId);
      const builds = await new BuildsModel(projectId).listByLabel(label.id);

      return await responseHTML(
        renderLabelDetailsPage({ builds, label, project }),
      );
    }

    const result: LabelsGetResultType = { label };
    return Response.json(result);
  },
);

export const deleteLabel = defineRoute(
  "delete",
  URLS.labels.id,
  {
    requestParams: {
      path: z.object({
        labelSlug: LabelSlugSchema,
        projectId: ProjectIdSchema,
      }),
    },
    responses: {
      ...commonErrorResponses(),
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
    await authenticateOrThrow({
      action: "delete",
      projectId,
      resource: "label",
    });

    await new LabelsModel(projectId).delete(labelSlug);

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.allLabels(projectId), 303);
    }

    return new Response(null, { status: 204 });
  },
);

export const updateLabel = defineRoute(
  "post",
  URLS.labels.update,
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
      ...commonErrorResponses(),
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
    await authenticateOrThrow({
      action: "update",
      projectId,
      resource: "label",
    });

    const validFormError = validateIsFormEncodedRequest(request);
    if (validFormError) {
      return await responseError(validFormError.message, validFormError.status);
    }

    await new LabelsModel(projectId).update(
      labelSlug,
      urlSearchParamsToObject(await request.formData()),
    );

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.labelSlug(projectId, labelSlug), 303);
    }

    return new Response(null, { status: 202 });
  },
);

export const updateLabelForm = defineRoute(
  "get",
  URLS.labels.update,
  {
    responses: {
      ...commonErrorResponses(),
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
        },
        description: "Form to update label",
      },
    },
    summary: "Form to update label",
    tags: [tag],
  },
  async ({ params: { projectId, labelSlug } }) => {
    await authenticateOrThrow({
      action: "update",
      projectId: undefined,
      resource: "label",
    });
    const label = await new LabelsModel(projectId).get(labelSlug);

    return await responseHTML(renderLabelUpdatePage({ label, projectId }));
  },
);
