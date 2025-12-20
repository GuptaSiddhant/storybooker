import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { BuildsModel } from "../models/builds-model.ts";
import { ProjectsModel } from "../models/projects-model.ts";
import { ProjectIdSchema } from "../models/projects-schema.ts";
import { TagsModel } from "../models/tags-model.ts";
import {
  TagCreateSchema,
  TagIdSchema,
  TagsGetResultSchema,
  TagsListResultSchema,
  TagTypes,
  TagUpdateSchema,
} from "../models/tags-schema.ts";
import { urlBuilder } from "../urls.ts";
import { authenticateOrThrow } from "../utils/auth.ts";
import { mimes } from "../utils/mime-utils.ts";
import {
  openapiCommonErrorResponses,
  openapiErrorResponseContent,
  openapiResponseRedirect,
  openapiResponsesHtml,
} from "../utils/openapi-utils.ts";
import { checkIsHTMLRequest } from "../utils/request.ts";
import { getStore } from "../utils/store.ts";
import { createUIAdapterOptions } from "../utils/ui-utils.ts";

const tagsTag = "Tags";
const projectIdPathParams = z.object({ projectId: ProjectIdSchema });
const tagIdPathParams = z.object({
  projectId: ProjectIdSchema,
  tagId: TagIdSchema,
});

/**
 * @private
 */
export const tagsRouter = new OpenAPIHono()
  .openapi(
    createRoute({
      summary: "List tags",
      method: "get",
      path: "/projects/{projectId}/tags",
      tags: [tagsTag],
      request: {
        params: projectIdPathParams,
        query: z.object({ type: z.union([z.enum(TagTypes), z.literal("")]) }).partial(),
      },
      responses: {
        200: {
          description: "A list of tags in the project.",
          content: {
            [mimes.json]: { schema: TagsListResultSchema },
            ...openapiResponsesHtml,
          },
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { ui } = getStore();
      const { projectId } = context.req.valid("param");

      authenticateOrThrow({
        action: "read",
        projectId,
        resource: "tag",
      });

      const { type } = context.req.valid("query");
      const tags = await new TagsModel(projectId).list();
      const filteredTags = type ? tags.filter((tag) => tag.type === type) : tags;

      if (ui?.renderTagsListPage && checkIsHTMLRequest()) {
        const project = await new ProjectsModel().get(projectId);

        return context.html(
          ui.renderTagsListPage(
            { project, tags: filteredTags, defaultType: type },
            createUIAdapterOptions(),
          ),
        );
      }

      return context.json({ tags: filteredTags });
    },
  )
  .openapi(
    createRoute({
      summary: "Create tag - UI",
      method: "get",
      path: "/projects/{projectId}/tags/create",
      tags: [tagsTag],
      request: { params: projectIdPathParams },
      responses: {
        200: {
          description: "UI to create tag",
          content: openapiResponsesHtml,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { ui } = getStore();
      if (!ui?.renderTagCreatePage) {
        throw new HTTPException(405, { message: "UI not available for this route." });
      }

      const { projectId } = context.req.valid("param");

      authenticateOrThrow({
        action: "create",
        projectId,
        resource: "tag",
      });

      const project = await new ProjectsModel().get(projectId);

      return context.html(ui?.renderTagCreatePage({ project }, createUIAdapterOptions()));
    },
  )
  .openapi(
    createRoute({
      summary: "Create tag - action",
      method: "post",
      path: "/projects/{projectId}/tags/create",
      tags: [tagsTag],
      request: {
        params: projectIdPathParams,
        body: {
          content: { [mimes.formEncoded]: { schema: TagCreateSchema } },
          required: true,
        },
      },
      responses: {
        201: {
          description: "Tag created successfully",
          content: { [mimes.json]: { schema: TagsGetResultSchema } },
        },
        303: openapiResponseRedirect("Redirect to tag."),
        409: {
          content: openapiErrorResponseContent,
          description: "Tag already exists.",
        },
        415: {
          content: openapiErrorResponseContent,
          description: "Unsupported Media Type",
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { projectId } = context.req.valid("param");

      const projectModel = new ProjectsModel().id(projectId);
      if (!(await projectModel.has())) {
        throw new HTTPException(404, { message: `The project '${projectId}' does not exist.` });
      }

      authenticateOrThrow({
        action: "create",
        projectId,
        resource: "tag",
      });

      const data = context.req.valid("form");
      const tag = await new TagsModel(projectId).create(data);

      if (checkIsHTMLRequest(true)) {
        return context.redirect(urlBuilder.tagDetails(projectId, tag.id), 303);
      }

      return context.json({ tag }, 201);
    },
  )
  .openapi(
    createRoute({
      summary: "Tag details",
      method: "get",
      path: "/projects/{projectId}/tags/{tagId}",
      tags: [tagsTag],
      request: { params: tagIdPathParams },
      responses: {
        200: {
          description: "Details of the tag",
          content: {
            [mimes.json]: { schema: TagsGetResultSchema },
            ...openapiResponsesHtml,
          },
        },
        404: {
          description: "Matching tag not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { ui } = getStore();
      const { projectId, tagId } = context.req.valid("param");

      authenticateOrThrow({
        action: "read",
        projectId,
        resource: "tag",
      });

      const tag = await new TagsModel(projectId).get(tagId);

      if (ui?.renderTagDetailsPage && checkIsHTMLRequest()) {
        const project = await new ProjectsModel().get(projectId);
        const builds = await new BuildsModel(projectId).listByTag(tag.id);

        return context.html(
          ui.renderTagDetailsPage({ builds, project, tag }, createUIAdapterOptions()),
        );
      }

      return context.json({ tag });
    },
  )
  .openapi(
    createRoute({
      summary: "Delete tag - action",
      method: "post",
      path: "/projects/{projectId}/tags/{tagId}/delete",
      tags: [tagsTag],
      request: { params: tagIdPathParams },
      responses: {
        204: { description: "Tag deleted successfully." },
        303: openapiResponseRedirect("Redirect to tags list."),
        404: {
          description: "Matching tag not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { projectId, tagId } = context.req.valid("param");
      authenticateOrThrow({
        action: "delete",
        projectId,
        resource: "tag",
      });

      await new TagsModel(projectId).delete(tagId);

      if (checkIsHTMLRequest(true)) {
        return context.redirect(urlBuilder.tagsList(projectId), 303);
      }

      return new Response(null, { status: 204 });
    },
  )
  .openapi(
    createRoute({
      summary: "Update tag - UI",
      method: "get",
      path: "/projects/{projectId}/tags/{tagId}/update",
      tags: [tagsTag],
      request: { params: tagIdPathParams },
      responses: {
        200: {
          description: "UI to upload tag",
          content: openapiResponsesHtml,
        },
        404: {
          description: "Matching tag not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { ui } = getStore();
      if (!ui?.renderTagUpdatePage) {
        throw new HTTPException(405, { message: "UI not available for this route." });
      }

      const { tagId, projectId } = context.req.valid("param");

      authenticateOrThrow({
        action: "update",
        projectId,
        resource: "tag",
      });

      const tag = await new TagsModel(projectId).get(tagId);
      const project = await new ProjectsModel().get(projectId);

      return context.html(ui.renderTagUpdatePage({ project, tag }, createUIAdapterOptions()));
    },
  )
  .openapi(
    createRoute({
      summary: "Update tag - action",
      method: "post",
      path: "/projects/{projectId}/tags/{tagId}/update",
      tags: [tagsTag],
      request: {
        params: tagIdPathParams,
        body: {
          content: { [mimes.formEncoded]: { schema: TagUpdateSchema } },
          required: true,
        },
      },
      responses: {
        202: { description: "Tag updated successfully" },
        303: openapiResponseRedirect("Redirect to tag."),
        404: {
          description: "Matching project or tag not found.",
          content: openapiErrorResponseContent,
        },
        415: {
          content: openapiErrorResponseContent,
          description: "Unsupported Media Type",
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { tagId, projectId } = context.req.valid("param");

      const tagsModel = new TagsModel(projectId);
      authenticateOrThrow({
        action: "update",
        projectId,
        resource: "tag",
      });

      const data = context.req.valid("form");
      await tagsModel.update(tagId, data);

      if (checkIsHTMLRequest(true)) {
        return context.redirect(urlBuilder.tagDetails(projectId, tagId), 303);
      }

      return new Response(null, { status: 202 });
    },
  );
