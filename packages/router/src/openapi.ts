import { CONTENT_TYPES, SERVICE_NAME } from "#utils/constants";
import { getStore } from "#store";
import { checkIsHTMLRequest } from "#utils/request";
import { OpenApiRouter, createRoute } from "#utils/api-router";
import { createDocument } from "zod-openapi";
import { responseHTML } from "#utils/response";

export const openapi = createRoute(
  "get",
  "/",
  {
    responses: {
      200: {
        content: {
          [CONTENT_TYPES.JSON]: {
            example: { info: { title: SERVICE_NAME }, openapi: "3.1.0" },
          },
          [CONTENT_TYPES.HTML]: {
            encoding: "utf8",
            example: "<!DOCTYPE html>",
            schema: { type: "string" },
          },
        },
      },
    },
    summary: "OpenAPI spec",
  },
  openApiHandler,
);

function openApiHandler(): Response {
  const { prefix, request } = getStore();

  const openAPISpec = createDocument({
    info: { title: SERVICE_NAME, version: "" },
    openapi: "3.1.0",
    paths: OpenApiRouter.paths,
    security: [],
    servers: [{ url: prefix }],
    tags: [],
  });

  const { searchParams } = new URL(request.url);
  if (searchParams.has("json")) {
    return Response.json(openAPISpec);
  }

  if (checkIsHTMLRequest()) {
    return responseHTML(generateOpenApiHTML({ content: openAPISpec }));
  }

  return Response.json(openAPISpec);
}

function generateOpenApiHTML(
  options: {
    authentication?: { securitySchemes: object };
    content: object;
  },
  title: string = SERVICE_NAME,
): string {
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />        
      </head>
      <body>
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        <script>
          Scalar.createApiReference('#app', ${JSON.stringify(options)})
        </script>
      </body>
    </html>
  `;

  return html;
}

/**
  securitySchemes: {
    bearerAuth: {
      token: 'default-token',
    },
  },
 */
