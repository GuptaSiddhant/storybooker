import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import z from "zod";
import { BuildsModel } from "../models/builds-model";
import { ProjectsModel } from "../models/projects-model";
import {
  ProjectCreateSchema,
  ProjectGetResultSchema,
  ProjectIdSchema,
  ProjectsListResultSchema,
  ProjectUpdateSchema,
} from "../models/projects-schema";
import { TagsModel } from "../models/tags-model";
import {
  ProjectCreatePage,
  ProjectDetailsPage,
  ProjectsPage,
  ProjectUpdatePage,
} from "../ui/projects-pages";
import { urlBuilder } from "../urls";
import { authenticateOrThrow } from "../utils/auth";
import { mimes } from "../utils/mime-utils";
import {
  openapiCommonErrorResponses,
  openapiErrorResponseContent,
  openapiResponseRedirect,
  openapiResponsesHtml,
} from "../utils/openapi-utils";
import { checkIsHTMLRequest, checkIsHXRequest } from "../utils/request";
import { responseRedirect } from "../utils/response";

const projectTag = "Projects";
const projectIdPathParams = z.object({ projectId: ProjectIdSchema });

export const projectsRouter = new OpenAPIHono()
  .openapi(
    createRoute({
      summary: "List projects",
      method: "get",
      path: "/projects",
      tags: [projectTag],
      responses: {
        200: {
          description: "A list of projects.",
          content: {
            [mimes.json]: { schema: ProjectsListResultSchema },
            ...openapiResponsesHtml,
          },
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      await authenticateOrThrow({
        action: "read",
        projectId: undefined,
        resource: "project",
      });

      const projects = await new ProjectsModel().list();

      if (checkIsHTMLRequest()) {
        return context.html(<ProjectsPage projects={projects} />);
      }

      return context.json({ projects });
    },
  )
  .openapi(
    createRoute({
      summary: "Create project UI",
      method: "get",
      path: "/projects/create",
      tags: [projectTag],
      responses: {
        200: {
          description: "UI to create project",
          content: openapiResponsesHtml,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      await authenticateOrThrow({
        action: "create",
        projectId: undefined,
        resource: "project",
      });

      return context.html(<ProjectCreatePage />);
    },
  )
  .openapi(
    createRoute({
      summary: "Create project action",
      method: "post",
      path: "/projects/create",
      tags: [projectTag],
      request: {
        body: {
          content: { [mimes.formEncoded]: { schema: ProjectCreateSchema } },
          required: true,
        },
      },
      responses: {
        201: {
          description: "Project created successfully",
          content: { [mimes.json]: { schema: ProjectGetResultSchema } },
        },
        303: openapiResponseRedirect("Redirect to project."),
        409: {
          content: openapiErrorResponseContent,
          description: "Project already exists.",
        },
        415: {
          content: openapiErrorResponseContent,
          description: "Unsupported Media Type",
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      await authenticateOrThrow({
        action: "create",
        projectId: undefined,
        resource: "project",
      });
      const data = ProjectCreateSchema.parse(await context.req.parseBody());
      const project = await new ProjectsModel().create(data);

      if (checkIsHTMLRequest() || checkIsHXRequest()) {
        return responseRedirect(urlBuilder.projectDetails(project.id), 303);
      }

      return context.json({ project });
    },
  )
  .openapi(
    createRoute({
      summary: "Project details",
      method: "get",
      path: "/projects/{projectId}",
      tags: [projectTag],
      request: { params: projectIdPathParams },
      responses: {
        200: {
          description: "Details of the project",
          content: {
            [mimes.json]: { schema: ProjectGetResultSchema },
            ...openapiResponsesHtml,
          },
        },
        404: {
          description: "Matching project not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { projectId } = context.req.param();

      await authenticateOrThrow({
        action: "read",
        projectId,
        resource: "project",
      });

      const project = await new ProjectsModel().get(projectId);

      if (checkIsHTMLRequest()) {
        const recentBuilds = await new BuildsModel(projectId).list({
          limit: 10,
        });
        const recentTags = await new TagsModel(projectId).list({ limit: 10 });

        return context.html(
          <ProjectDetailsPage
            project={project}
            recentBuilds={recentBuilds}
            recentTags={recentTags}
          />,
        );
      }

      return context.json({ project });
    },
  )
  .openapi(
    createRoute({
      summary: "Delete project action",
      method: "post",
      path: "/projects/{projectId}/delete",
      tags: [projectTag],
      request: { params: projectIdPathParams },
      responses: {
        204: { description: "Project deleted successfully." },
        303: openapiResponseRedirect("Redirect to projects list."),
        404: {
          description: "Matching project not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { projectId } = context.req.param();
      await authenticateOrThrow({
        action: "delete",
        projectId,
        resource: "project",
      });

      try {
        await new ProjectsModel().delete(projectId);

        if (checkIsHTMLRequest() || checkIsHXRequest()) {
          return responseRedirect(urlBuilder.projectsList(), 303);
        }

        return new Response(null, { status: 204 });
      } catch {
        return context.notFound();
      }
    },
  )
  .openapi(
    createRoute({
      summary: "Update project UI",
      method: "get",
      path: "/projects/{projectId}/update",
      tags: [projectTag],
      request: { params: projectIdPathParams },
      responses: {
        200: {
          description: "UI to update project",
          content: openapiResponsesHtml,
        },
        404: {
          description: "Matching project not found.",
          content: openapiErrorResponseContent,
        },
        ...openapiCommonErrorResponses,
      },
    }),
    async (context) => {
      const { projectId } = context.req.param();
      await authenticateOrThrow({
        action: "update",
        projectId,
        resource: "project",
      });
      const project = await new ProjectsModel().get(projectId);

      return context.html(<ProjectUpdatePage project={project} />);
    },
  )
  .openapi(
    createRoute({
      summary: "Update project action",
      method: "post",
      path: "/projects/{projectId}/update",
      tags: [projectTag],
      request: {
        params: projectIdPathParams,
        body: {
          content: { [mimes.formEncoded]: { schema: ProjectUpdateSchema } },
          required: true,
        },
      },
      responses: {
        202: { description: "Project updated successfully" },
        303: openapiResponseRedirect("Redirect to project."),
        404: {
          description: "Matching project not found.",
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
      const { projectId } = context.req.param();
      await authenticateOrThrow({
        action: "update",
        projectId: undefined,
        resource: "project",
      });
      const data = ProjectUpdateSchema.parse(await context.req.parseBody());
      await new ProjectsModel().update(projectId, data);

      if (checkIsHTMLRequest() || checkIsHXRequest()) {
        return responseRedirect(urlBuilder.projectDetails(projectId), 303);
      }

      return new Response(null, { status: 202 });
    },
  );
