import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { SERVICE_NAME } from "..";
import { handleStaticFileRoute } from "../handlers/handle-static-file-route";
import { accountRouter } from "./account-router";
import { buildsRouter } from "./builds-router";
import { projectsRouter } from "./projects-router";
import { rootRouter } from "./root-router";
import { tagsRouter } from "./tags-router";
import { tasksRouter } from "./tasks-router";

export const appRouter = new OpenAPIHono({ strict: false })
  .doc31("/openapi.json", {
    openapi: "3.1.0",
    info: { version: "1.0.0", title: SERVICE_NAME },
  })
  .use(logger())
  .get("/openapi", swaggerUI({ url: "/openapi.json" }))
  .route("/", rootRouter)
  .route("/", projectsRouter)
  .route("/", buildsRouter)
  .route("/", tagsRouter)
  .route("/tasks", tasksRouter)
  .route("/account", accountRouter)
  .get("/:filepath{.+}", () => handleStaticFileRoute());

export type AppRouter = typeof appRouter;
