import type { Middleware } from "openapi-fetch";
import type z from "zod";
import type { sharedSchemas } from "./schema-utils.ts";

export function createAuthMiddleware(options: {
  authType: z.infer<typeof sharedSchemas.authType>;
  authValue: z.infer<typeof sharedSchemas.authValue>;
}): Middleware {
  const { authType, authValue } = options;
  return {
    onRequest: ({ request }) => {
      if (authValue === undefined || authValue === "") {
        return request;
      }
      if (!authType) {
        return request;
      }

      switch (authType) {
        case "auth-header": {
          request.headers.set("Authorization", authValue);
          return request;
        }
        //
        default: {
          return request;
        }
      }
    },
  };
}
