import "hono"; // import hono to trick vercel into recognizing hono app
import { createBasicUIAdapter } from "@storybooker/ui";
import { createHonoRouter } from "storybooker";
import { VercelEdgeConfigDatabaseService } from "./database.ts";
import { VercelBlobService } from "./storage.ts";

const storageToken = process.env["BLOB_READ_WRITE_TOKEN"];
if (!storageToken) {
  throw new Error("env BLOB_READ_WRITE_TOKEN is not defined.");
}

const edgeConfigId = process.env["EDGE_CONFIG_ID"];
if (!edgeConfigId) {
  throw new Error("env EDGE_CONFIG_ID is not defined.");
}
const edgeClientToken = process.env["VERCEL_OIDC_TOKEN"];
if (!edgeClientToken) {
  throw new Error("env EDGE_CONFIG_TOKEN is not defined.");
}

const app = createHonoRouter({
  database: new VercelEdgeConfigDatabaseService({
    apiToken: edgeClientToken,
    configId: edgeConfigId,
  }),
  storage: new VercelBlobService(storageToken),
  ui: createBasicUIAdapter({ logo: "/vercel.png" }),
});

export default app;
