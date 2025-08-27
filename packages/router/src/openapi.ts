import { getStore } from "#store";
import { defineRoute, OpenApiRouter } from "#utils/api-router";
import { CONTENT_TYPES, SERVICE_NAME } from "#utils/constants";
import { checkIsHTMLRequest } from "#utils/request";
import { responseHTML } from "#utils/response";
import { createDocument } from "zod-openapi";

export const openapi = defineRoute(
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
  const { prefix, request, openAPI } = getStore();

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
    const paramsUI = new URL(request.url).searchParams.get("ui");
    const ui = paramsUI ?? openAPI?.ui;
    if (ui === "scalar") {
      return responseHTML(generateOpenApiScalar({ content: openAPISpec }));
    }

    return responseHTML(generateOpenApiSwagger(openAPISpec));
  }

  return Response.json(openAPISpec);
}

function generateOpenApiScalar(
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

function generateOpenApiSwagger(
  spec: object,
  title: string = SERVICE_NAME,
): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${title} SwaggerUI" />
    <title>${title}</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js" crossorigin></script>
</head>
<body style="position: relative;">
  <div id="swagger-ui"></div>
  <div style="position: absolute; top: 0; right: 0; padding-right: 16px; display: flex; gap: 0.5rem;">
    <form>
      <input type="hidden" name="download" value="json" />
      <button type="submit">Download</button>
    </form>
    <button type="button" onClick="window.location.reload();">Refresh</button>
  </div>
  <script async defer>
      window.swaggerUI = SwaggerUIBundle(${JSON.stringify({
        dom_id: "#swagger-ui",
        spec,
      })});
  </script>
</body>
</html>`;
}
