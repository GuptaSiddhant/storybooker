// oxlint-disable max-lines

import z from "zod";
import { BuildsModel } from "../builds/model";
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
import { ProjectIdSchema, TagSlugSchema } from "../utils/shared-model";
import { urlSearchParamsToObject } from "../utils/url";
import { TagsModel } from "./model";
import {
  TagCreateSchema,
  TagsGetResultSchema,
  TagsListResultSchema,
  TagUpdateSchema,
  type TagsGetResultType,
  type TagsListResultType,
} from "./schema";
import {
  renderTagCreatePage,
  renderTagDetailsPage,
  renderTagsPage,
  renderTagUpdatePage,
} from "./ui/render";

const tag = "Tags";

export const listTags = defineRoute(
  "get",
  URLS.tags.all,
  {
    requestParams: {
      path: z.object({ projectId: ProjectIdSchema }),
    },
    responses: {
      ...commonErrorResponses(),
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
          [CONTENT_TYPES.JSON]: { schema: TagsListResultSchema },
        },
        description: "A list of tags.",
      },
    },
    summary: "List all tags for a project",
    tags: [tag],
  },
  async ({ params: { projectId }, request }) => {
    await authenticateOrThrow({ action: "read", projectId, resource: "tag" });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const tags = await new TagsModel(projectId).list({
      filter: type ? (item): boolean => item.type === type : undefined,
    });

    if (checkIsHTMLRequest()) {
      const project = await new ProjectsModel().get(projectId);
      return await responseHTML(
        renderTagsPage({ defaultType: type, project, tags }),
      );
    }

    const result: TagsListResultType = { tags: tags };
    return Response.json(result);
  },
);

export const createTag = defineRoute(
  "post",
  URLS.tags.create,
  {
    requestBody: {
      content: { [CONTENT_TYPES.FORM_ENCODED]: { schema: TagCreateSchema } },
      description: "Data about the tag",
      required: true,
    },
    requestParams: { path: z.object({ projectId: ProjectIdSchema }) },
    responses: {
      ...commonErrorResponses(),
      201: {
        content: {
          [CONTENT_TYPES.JSON]: { schema: TagsGetResultSchema },
        },
        description: "Tag created successfully",
      },
      303: {
        description: "Tag created, redirecting...",
        headers: { Location: z.url() },
      },
      409: { content: errorContent, description: "Tag already exists." },
      415: { description: "Unsupported Media Type" },
    },
    summary: "Create a new tag",
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
      resource: "tag",
    });

    const tag = await new TagsModel(projectId).create(
      urlSearchParamsToObject(await request.formData()),
    );

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.tagSlug(projectId, tag.id), 303);
    }

    const result: TagsGetResultType = { tag };
    return Response.json(result, { status: 201 });
  },
);

export const createTagForm = defineRoute(
  "get",
  URLS.tags.create,
  {
    responses: {
      ...commonErrorResponses(),
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
        },
        description: "Form to create tag",
      },
    },
    summary: "Form to create tag",
    tags: [tag],
  },
  async ({ params: { projectId } }) => {
    await authenticateOrThrow({
      action: "create",
      projectId: undefined,
      resource: "tag",
    });
    const project = await new ProjectsModel().get(projectId);

    return await responseHTML(renderTagCreatePage({ project }));
  },
);

export const getTag = defineRoute(
  "get",
  URLS.tags.id,
  {
    requestParams: {
      path: z.object({
        projectId: ProjectIdSchema,
        tagSlug: TagSlugSchema,
      }),
    },
    responses: {
      ...commonErrorResponses(),
      200: {
        content: {
          [CONTENT_TYPES.JSON]: { schema: TagsGetResultSchema },
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
        },
        description: "Tag details retrieved successfully",
      },
    },
    summary: "Get Tag details",
    tags: [tag],
  },
  async ({ params: { tagSlug, projectId } }) => {
    await authenticateOrThrow({ action: "read", projectId, resource: "tag" });

    const tag = await new TagsModel(projectId).get(tagSlug);

    if (checkIsHTMLRequest()) {
      const project = await new ProjectsModel().get(projectId);
      const builds = await new BuildsModel(projectId).listByTag(tag.id);

      return await responseHTML(renderTagDetailsPage({ builds, project, tag }));
    }

    const result: TagsGetResultType = { tag };
    return Response.json(result);
  },
);

export const deleteTag = defineRoute(
  "delete",
  URLS.tags.id,
  {
    requestParams: {
      path: z.object({
        projectId: ProjectIdSchema,
        tagSlug: TagSlugSchema,
      }),
    },
    responses: {
      ...commonErrorResponses(),
      204: { description: "Tag deleted successfully" },
      303: {
        description: "Tag deleted, redirecting...",
        headers: { Location: z.url() },
      },
      404: { description: "Tag not found" },
    },
    summary: "Delete Tag",
    tags: [tag],
  },
  async ({ params: { tagSlug, projectId } }) => {
    await authenticateOrThrow({
      action: "delete",
      projectId,
      resource: "tag",
    });

    await new TagsModel(projectId).delete(tagSlug);

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.allTags(projectId), 303);
    }

    return new Response(null, { status: 204 });
  },
);

export const updateTag = defineRoute(
  "post",
  URLS.tags.update,
  {
    requestBody: {
      content: {
        [CONTENT_TYPES.FORM_ENCODED]: { schema: TagUpdateSchema },
      },
      description: "Updated tag data",
      required: true,
    },
    requestParams: {
      path: z.object({
        projectId: ProjectIdSchema,
        tagSlug: TagSlugSchema,
      }),
    },
    responses: {
      ...commonErrorResponses(),
      202: { description: "Tag updated successfully" },
      303: {
        description: "Tag updated, redirecting...",
        headers: { Location: z.url() },
      },
      404: { description: "Matching project or Tag not found." },
      415: { description: "Unsupported Media Type" },
    },
    summary: "Update Tag details",
    tags: [tag],
  },
  async ({ params: { tagSlug, projectId }, request }) => {
    await authenticateOrThrow({
      action: "update",
      projectId,
      resource: "tag",
    });

    const validFormError = validateIsFormEncodedRequest(request);
    if (validFormError) {
      return await responseError(validFormError.message, validFormError.status);
    }

    await new TagsModel(projectId).update(
      tagSlug,
      urlSearchParamsToObject(await request.formData()),
    );

    if (checkIsHTMLRequest() || checkIsHXRequest()) {
      return responseRedirect(urlBuilder.tagSlug(projectId, tagSlug), 303);
    }

    return new Response(null, { status: 202 });
  },
);

export const updateTagForm = defineRoute(
  "get",
  URLS.tags.update,
  {
    responses: {
      ...commonErrorResponses(),
      200: {
        content: {
          [CONTENT_TYPES.HTML]: { example: "<!DOCTYPE html>" },
        },
        description: "Form to update tag",
      },
    },
    summary: "Form to update tag",
    tags: [tag],
  },
  async ({ params: { projectId, tagSlug } }) => {
    await authenticateOrThrow({
      action: "update",
      projectId: undefined,
      resource: "tag",
    });
    const tag = await new TagsModel(projectId).get(tagSlug);

    return await responseHTML(renderTagUpdatePage({ projectId, tag }));
  },
);
