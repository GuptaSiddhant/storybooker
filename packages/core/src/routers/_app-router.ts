import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import YAML from "js-yaml";
import pkgJson from "../../package.json" with { type: "json" };
import { SERVICE_NAME } from "../utils/constants";
import { getStore } from "../utils/store";
import { createUIAdapterOptions } from "../utils/ui-utils";
import { accountRouter } from "./account-router";
import { buildsRouter } from "./builds-router";
import { projectsRouter } from "./projects-router";
import { rootRouter } from "./root-router";
import { tagsRouter } from "./tags-router";
import { tasksRouter } from "./tasks-router";

export const openapiConfig = {
  openapi: "3.1.0",
  info: { version: pkgJson.version, title: SERVICE_NAME },
};

export type AppRouter = typeof appRouter;
export const appRouter = new OpenAPIHono({ strict: false })
  .doc31("/openapi.json", openapiConfig)
  .get("/openapi.yaml", (ctx) => {
    const spec = (appRouter as OpenAPIHono).getOpenAPI31Document(openapiConfig);
    const content: string = YAML.dump(spec, { forceQuotes: true });
    return ctx.body(content, 200, { "Content-Type": "application/yaml" });
  })
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
