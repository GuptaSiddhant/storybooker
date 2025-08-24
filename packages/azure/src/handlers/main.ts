import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { getStore } from "#store";
import type { HttpResponse, HttpResponseInit } from "@azure/functions";
import { responseError } from "#utils/response";
import { urlJoin } from "#utils/url";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { checkIsHTMLRequest } from "#utils/request";
import { CONTENT_TYPES, HEADERS, SERVICE_NAME } from "#constants";
import { generateOpenApiHTML } from "#utils/openapi";
import { commonSchemas, router } from "../router";

const openAPIHandler = new OpenAPIHandler(router, {
  plugins: [new CORSPlugin()],
});

export async function mainHandler(): Promise<HttpResponse | HttpResponseInit> {
  const { baseRoute, openAPI, request } = getStore();

  try {
    const fetchRequest = new Request(request.url, {
      // oxlint-disable-next-line no-invalid-fetch-options
      body: request.body as ReadableStream | null,
      // @ts-expect-error - Duplex is required for streaming but not supported in TS
      duplex: "half",
      headers: request.headers as Headers,
      method: request.method,
    });

    const result = await openAPIHandler.handle(fetchRequest, {
      context: { headers: Object.fromEntries(fetchRequest.headers.entries()) },
      prefix: generatePrefixFromBaseRoute(baseRoute),
    });
    if (result.matched) {
      return result.response as unknown as HttpResponse;
    }

    const { pathname } = new URL(request.url);
    if (openAPI !== null && pathname === urlJoin(baseRoute, "openapi")) {
      return await handleOpenAPIRoute();
    }

    return responseError(`No matching route '${pathname}'`, 404);
  } catch (error) {
    return responseError(error);
  }
}

function generatePrefixFromBaseRoute(
  baseRoute: string,
): `/${string}` | undefined {
  if (!baseRoute) {
    return undefined;
  }
  if (baseRoute.startsWith("/")) {
    return baseRoute as `/${string}`;
  }
  return `/${baseRoute}` as const;
}

async function handleOpenAPIRoute(): Promise<HttpResponseInit> {
  const { baseRoute, openAPI } = getStore();
  const { servers } = openAPI || {};
  const openAPIGenerator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  });
  const spec = await openAPIGenerator.generate(router, {
    // components: { securitySchemes: { bearerAuth: {scheme: "bearer", type: "http", }, }, },
    commonSchemas,
    info: { title: SERVICE_NAME, version: "" },
    // security: [{ bearerAuth: [] }],
    servers: servers || [
      { url: generatePrefixFromBaseRoute(baseRoute) || "/" },
    ],
  });

  if (checkIsHTMLRequest()) {
    return {
      body: generateOpenApiHTML(spec),
      headers: { [HEADERS.contentType]: CONTENT_TYPES.HTML },
      status: 200,
    };
  }

  return { jsonBody: spec, status: 200 };
}
