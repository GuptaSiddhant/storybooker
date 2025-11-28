import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getStore } from "../utils/store";
import { createUIAdapterOptions } from "../utils/ui-utils";
import { accountRouter } from "./account-router";
import { buildsRouter } from "./builds-router";
import { projectsRouter } from "./projects-router";
import { rootRouter } from "./root-router";
import { tagsRouter } from "./tags-router";
import { tasksRouter } from "./tasks-router";

export type AppRouter = typeof appRouter;
export const appRouter = new OpenAPIHono({ strict: false })
  .route("/", rootRouter)
  .route("/", projectsRouter)
  .route("/", buildsRouter)
  .route("/", tagsRouter)
  .route("/tasks", tasksRouter)
  .route("/account", accountRouter)
  .get("/openapi", swaggerUI({ url: "/openapi.json" }))
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
