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
export interface StoryBookerAdapterMetadata<
  Data extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Name of the service/adapter */
  readonly name: string;
  /** Description of the service/adapter */
  readonly description: string;
  /** API version of the service/SDK */
  readonly version?: string;
  /** Unique identifier for the service/adapter */
  readonly id?: string;
  /** URL of the service/adapter */
  readonly url?: string;
  /** Additional data about the service/adapter */
  readonly data?: Data;
}
