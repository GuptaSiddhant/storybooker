import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import z from "zod";
import { BuildsModel } from "../models/builds-model";
import { ProjectsModel } from "../models/projects-model";
import { ProjectIdSchema } from "../models/projects-schema";
import { TagsModel } from "../models/tags-model";
import {
  TagCreateSchema,
  TagIdSchema,
  TagsGetResultSchema,
  TagsListResultSchema,
  TagTypes,
  TagUpdateSchema,
} from "../models/tags-schema";
import { urlBuilder } from "../urls";
import { authenticateOrThrow } from "../utils/auth";
import { mimes } from "../utils/mime-utils";
import {
  openapiCommonErrorResponses,
  openapiErrorResponseContent,
  openapiResponseRedirect,
  openapiResponsesHtml,
} from "../utils/openapi-utils";
import { checkIsHTMLRequest } from "../utils/request";
import { responseError, responseRedirect } from "../utils/response";
import { getStore } from "../utils/store";
import { createUIAdapterOptions } from "../utils/ui-utils";

const tagsTag = "Tags";
const projectIdPathParams = z.object({ projectId: ProjectIdSchema });
const tagIdPathParams = z.object({
  projectId: ProjectIdSchema,
  tagId: TagIdSchema,
});

export const tagsRouter = new OpenAPIHono()
  .openapi(
    createRoute({
      summary: "List tags",
      method: "get",
      path: "/projects/{projectId}/tags",
      tags: [tagsTag],
      request: {
        params: projectIdPathParams,
        query: z
          .object({ type: z.union([z.enum(TagTypes), z.literal("")]) })
          .partial(),
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
      const { projectId } = context.req.param();

      await authenticateOrThrow({
        action: "read",
        projectId,
        resource: "tag",
      });

      const type = context.req.query("type");
      const tags = await new TagsModel(projectId).list({
        filter: type ? (item): boolean => item.type === type : undefined,
      });

      if (ui && checkIsHTMLRequest()) {
        const project = await new ProjectsModel().get(projectId);
        return context.html(
          ui.renderTagsListPage(
            { project, tags, defaultType: type },
            createUIAdapterOptions(),
          ),
        );
      }

      return context.json({ tags });
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
      if (!ui) {
        return context.notFound();
      }

      const { projectId } = context.req.param();

      await authenticateOrThrow({
        action: "create",
        projectId,
        resource: "tag",
      });

      const project = await new ProjectsModel().get(projectId);

      return context.html(
        ui.renderTagCreatePage({ project }, createUIAdapterOptions()),
      );
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
      const { projectId } = context.req.param();

      const projectModel = new ProjectsModel().id(projectId);
      if (!(await projectModel.has())) {
        return await responseError(
          `The project '${projectId}' does not exist.`,
          404,
        );
      }

      await authenticateOrThrow({
        action: "create",
        projectId,
        resource: "tag",
      });

      const data = TagCreateSchema.parse(await context.req.parseBody());
      const tag = await new TagsModel(projectId).create(data);

      if (checkIsHTMLRequest(true)) {
        return responseRedirect(urlBuilder.tagDetails(projectId, tag.id), 303);
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
      const { projectId, tagId } = context.req.param();

      await authenticateOrThrow({
        action: "read",
        projectId,
        resource: "tag",
      });

      const tag = await new TagsModel(projectId).get(tagId);

      if (ui && checkIsHTMLRequest()) {
        const project = await new ProjectsModel().get(projectId);
        const builds = await new BuildsModel(projectId).listByTag(tag.id);

        return context.html(
          ui.renderTagDetailsPage(
            { builds, project, tag },
            createUIAdapterOptions(),
          ),
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
      const { projectId, tagId } = context.req.param();
      await authenticateOrThrow({
        action: "delete",
        projectId,
        resource: "tag",
      });

      try {
        await new TagsModel(projectId).delete(tagId);

        if (checkIsHTMLRequest(true)) {
          return responseRedirect(urlBuilder.tagsList(projectId), 303);
        }

        return new Response(null, { status: 204 });
      } catch {
        if (checkIsHTMLRequest(true)) {
          return responseRedirect(urlBuilder.tagsList(projectId), 303);
        }

        return context.notFound();
      }
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
      if (!ui) {
        return context.notFound();
      }

      const { tagId, projectId } = context.req.param();

      await authenticateOrThrow({
        action: "update",
        projectId,
        resource: "tag",
      });

      const tag = await new TagsModel(projectId).get(tagId);
      const project = await new ProjectsModel().get(projectId);

      return context.html(
        ui.renderTagUpdatePage({ project, tag }, createUIAdapterOptions()),
      );
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
      const { tagId, projectId } = context.req.param();

      const tagsModel = new TagsModel(projectId);

      if (!(await tagsModel.has(tagId))) {
        return await responseError(
          `The tag '${tagId}' does not exist in project '${projectId}'.`,
          404,
        );
      }

      await authenticateOrThrow({
        action: "update",
        projectId,
        resource: "tag",
      });

      const data = TagUpdateSchema.parse(await context.req.parseBody());
      await tagsModel.update(tagId, data);

      if (checkIsHTMLRequest(true)) {
        return responseRedirect(urlBuilder.tagDetails(projectId, tagId), 303);
      }

      return new Response(null, { status: 202 });
    },
  );
