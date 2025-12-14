import type { ResponseConfig, ZodContentObject } from "@asteasolutions/zod-to-openapi";
import { z } from "@hono/zod-openapi";
import { mimes } from "./mime-utils.ts";

export const openapiResponsesHtml = {
  [mimes.html]: { schema: z.string().openapi({ example: "<!DOCTYPE html>" }) },
} as const satisfies ZodContentObject;

export function openapiResponseRedirect(description: string): ResponseConfig {
  return {
    description,
    headers: {
      location: {
        description: "Location/URL to redirect.",
        schema: { type: "string" },
        required: true,
      },
      "hx-location": {
        description: "Location/URL to redirect using HTMX.",
        schema: { type: "string" },
        required: false,
      },
    },
  };
}

export const openapiErrorResponseContent: ZodContentObject = {
  [mimes.json]: {
    schema: z.object({ errorMessage: z.string() }).meta({ id: "ResponseError" }),
  },
};
export const openapiCommonErrorResponses: Record<number | string, ResponseConfig> = {
  400: {
    content: openapiErrorResponseContent,
    description: "Invalid request data",
  },
  401: {
    content: openapiErrorResponseContent,
    description: "Unauthenticated access",
  },
  403: {
    content: openapiErrorResponseContent,
    description: "Unauthorised access",
  },
  500: {
    content: openapiErrorResponseContent,
    description: "An unexpected server-error occurred.",
  },
};
