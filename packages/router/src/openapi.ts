import { CONTENT_TYPES, HEADERS, SERVICE_NAME } from "#constants";
import { getStore } from "#store";
import { checkIsHTMLRequest } from "#utils/request";
import { generatePrefixFromBaseRoute } from "#utils/url";

export function openApiHandler(): Response {
  const { baseRoute, request } = getStore();
  // const { servers } = openAPI || {};
  const spec = {
    // components: { securitySchemes: { bearerAuth: {scheme: "bearer", type: "http", }, }, },
    commonSchemas: {},
    info: { title: SERVICE_NAME, version: "" },
    // security: [{ bearerAuth: [] }],
    servers: [{ url: generatePrefixFromBaseRoute(baseRoute) || "/" }],
  };

  const { searchParams } = new URL(request.url);
  if (searchParams.has("json")) {
    return Response.json(spec);
  }

  if (checkIsHTMLRequest()) {
    return new Response(generateOpenApiHTML({ content: spec }), {
      headers: { [HEADERS.contentType]: CONTENT_TYPES.HTML },
      status: 200,
    });
  }

  return Response.json(spec);
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
