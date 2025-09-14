import z from "zod";
import { sharedSchemas } from "../utils/schema-utils";

export type PurgeSchemaInputs = z.infer<typeof PurgeSchema>;
export const PurgeSchema = z.object({
  project: sharedSchemas.project,
  url: sharedSchemas.url,
  label: z.string().meta({
    alias: ["l"],
    description: "The label slug to purge associated builds.",
  }),
});
