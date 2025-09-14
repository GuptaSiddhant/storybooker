// oxlint-disable new-cap

import { styleText } from "node:util";
import createClient from "openapi-fetch";
import type { CommandModule } from "yargs";
import z from "zod";
import type { paths } from "../service-schema";
import { createAuthMiddleware } from "../utils/auth-utils";
import {
  sharedSchemas,
  zodSchemaToCommandBuilder,
} from "../utils/schema-utils";

const PurgeSchema = z.object({
  project: sharedSchemas.project,
  url: sharedSchemas.url,
  label: z.string().meta({
    alias: ["l"],
    description: "The label slug to purge associated builds.",
  }),
  authType: sharedSchemas.authType,
  authValue: sharedSchemas.authValue,
});

export const purgeCommandModule: CommandModule = {
  command: "purge",
  describe: "Purge StoryBook assets from the service.",
  builder: zodSchemaToCommandBuilder(PurgeSchema),
  handler: async (args): Promise<void> => {
    const result = PurgeSchema.safeParse(args);
    if (!result.success) {
      throw new Error(z.prettifyError(result.error));
    }

    const { label, project, url, authType, authValue } = result.data;
    const client = createClient<paths>({ baseUrl: url });
    client.use(createAuthMiddleware({ authType, authValue }));

    try {
      console.group(
        styleText("bold", "\nPurge Label '%s' (project: %s)"),
        label,
        project,
      );

      console.log(`> Deleting label '%s' and associated builds...`, label);
      const { error, response } = await client.DELETE(
        "/projects/{projectId}/labels/{labelSlug}",
        {
          params: { path: { labelSlug: label, projectId: project } },
          headers: { Accept: "application/json" },
        },
      );

      if (error) {
        throw new Error(
          error.errorMessage ||
            `Request to service failed with status: ${response.status}.`,
        );
      } else {
        console.log("> Purged '%s / %s'.", project, label);
      }

      console.groupEnd();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  },
};
