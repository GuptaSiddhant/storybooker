import { SERVICE_NAME } from "../utils/constants.ts";

export function generateDatabaseCollectionId(
  projectId: string,
  suffix: "Tags" | "Builds" | "",
): string {
  if (!suffix) {
    return `${SERVICE_NAME}-${projectId}`;
  }

  return `${SERVICE_NAME}-${projectId}-${suffix}`;
}

export function generateStorageContainerId(projectId: string): string {
  return `${SERVICE_NAME}-${projectId}`;
}

/**
 * Metadata information about a StoryBooker adapter.
 */
export interface StoryBookerAdapterMetadata {
  name: string;
  description?: string;
  version?: string;
  [key: string]: unknown;
}
