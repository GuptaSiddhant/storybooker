import { styleText } from "node:util";
import createClient from "openapi-fetch";
import type { CommandModule } from "yargs";
import z from "zod";
import type { paths } from "../service-schema";
import { zodSchemaToCommandBuilder } from "../utils/schema-utils";
import { PurgeSchema } from "./purge-schema";
import { purgeSBRLabel } from "./purge-service";

export const purgeCommandModule: CommandModule = {
  command: "purge",
  describe: "Purge StoryBook assets from the service.",
  builder: zodSchemaToCommandBuilder(PurgeSchema),
  handler: async (args): Promise<void> => {
    const result = PurgeSchema.safeParse(args);
    if (!result.success) {
      throw new Error(z.prettifyError(result.error));
    }

    const { label, project, url } = result.data;
    const client = createClient<paths>({ baseUrl: url });

    try {
      console.group(
        styleText("bold", "\nPurge Label '%s' (project: %s)"),
        label,
        project,
      );
      await purgeSBRLabel(client, result.data);
      console.groupEnd();
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  },
};
