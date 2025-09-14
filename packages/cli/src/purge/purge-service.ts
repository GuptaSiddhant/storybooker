// oxlint-disable new-cap

import type { Client } from "openapi-fetch";
import type { paths } from "../service-schema";
import type { PurgeSchemaInputs } from "./purge-schema";

type ServiceClient = Client<paths, `${string}/${string}`>;

export async function purgeSBRLabel(
  client: ServiceClient,
  { label, project }: PurgeSchemaInputs,
): Promise<void> {
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
}
