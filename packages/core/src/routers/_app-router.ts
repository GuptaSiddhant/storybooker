import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { SERVICE_NAME } from "..";
import { handleStaticFileRoute } from "../handlers/handle-static-file-route";
import { buildsRouter } from "./builds-router";
import { projectsRouter } from "./projects-router";
import { rootRouter } from "./root-router";

export const appRouter = new OpenAPIHono({ strict: false })
  .doc("/openapi.json", {
    openapi: "3.0.0",
    info: { version: "1.0.0", title: SERVICE_NAME },
  })
  .use(logger())
  .get("/openapi", swaggerUI({ url: "/openapi.json" }))
  .route("/", rootRouter)
  .route("/", projectsRouter)
  .route("/", buildsRouter)
  .get("/{filepath{.+}}", () => handleStaticFileRoute());

export type AppRouter = typeof appRouter;
