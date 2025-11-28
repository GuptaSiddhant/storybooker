// oxlint-disable explicit-function-return-type
// oxlint-disable explicit-module-boundary-types

import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { MiddlewareHandler } from "hono";
import { logger } from "hono/logger";
import { SERVICE_NAME } from "..";
import pkgJson from "../../package.json" with { type: "json" };
import { getStore } from "../utils/store";
import { createUIAdapterOptions } from "../utils/ui-utils";
import { accountRouter } from "./account-router";
import { buildsRouter } from "./builds-router";
import { projectsRouter } from "./projects-router";
import { rootRouter } from "./root-router";
import { tagsRouter } from "./tags-router";
import { tasksRouter } from "./tasks-router";

export type AppRouter = ReturnType<typeof generateAppRouter>;

export function generateAppRouter(
  options: { middlewares?: MiddlewareHandler[] } = {},
) {
  const { middlewares = [] } = options;

  return new OpenAPIHono({ strict: false })
    .doc31("/openapi.json", {
      openapi: "3.1.0",
      info: { version: pkgJson.version, title: SERVICE_NAME },
    })
    .use(logger())
    .use(...middlewares)
    .get("/openapi", swaggerUI({ url: "/openapi.json" }))
    .route("/", rootRouter)
    .route("/", projectsRouter)
    .route("/", buildsRouter)
    .route("/", tagsRouter)
    .route("/tasks", tasksRouter)
    .route("/account", accountRouter)
    .get("/:filepath{.+}", async (context) => {
      const { ui } = getStore();
      if (!ui?.handleUnhandledRoute) {
        return context.notFound();
      }

      return await ui.handleUnhandledRoute(
        context.req.param("filepath"),
        createUIAdapterOptions(),
      );
    });
}
