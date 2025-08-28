import z from "zod";
import { PATTERNS, SERVICE_NAME } from "./constants";

type Obj = Record<string, unknown>;

export interface ListOptions<Item extends Record<string, unknown>> {
  limit?: number;
  filter?: string | ((item: Item) => boolean);
  select?: string[];
  sort?: "latest" | ((item1: Item, item2: Item) => number);
}

export interface BaseModel<Data extends Obj> {
  list(options?: ListOptions<Data>): Promise<Data[]>;
  create(data: unknown): Promise<Data>;
  get(id: string): Promise<Data>;
  has(id: string): Promise<boolean>;
  update(id: string, data: unknown): Promise<void>;
  delete(id: string): Promise<void>;
  id: (id: string) => BaseIdModel<Data>;
}

export interface BaseIdModel<Data extends Obj> {
  id: string;
  get(): Promise<Data>;
  has(): Promise<boolean>;
  update(data: unknown): Promise<void>;
  delete(): Promise<void>;
}

/** @private */
export const ProjectIdSchema = z
  .string()
  .refine(
    (val) => new RegExp(PATTERNS.projectId.pattern).test(val),
    PATTERNS.projectId.message,
  )
  .meta({ description: "The ID of the project.", id: "projectId" });

/** @private */
export const BuildSHASchema = z
  .string()
  .check(z.minLength(7))
  .meta({ description: "The SHA of the build.", id: "buildSHA" });

/** @private */
export const LabelSlugSchema = z
  .string()
  .meta({ description: "The slug of the label.", id: "labelSlug" });

/** @private */
export const EmptyObjectSchema = z.object();

export function generateProjectCollectionName(
  projectId: string,
  suffix: "Labels" | "Builds",
): string {
  return `${SERVICE_NAME}${projectId
    .replaceAll(/\W+/g, "")
    .toUpperCase()}${suffix}`;
}

export function generateProjectContainerName(projectId: string): string {
  return `${SERVICE_NAME}-${projectId.replaceAll(/[^\w-]+/g, "-")}`
    .slice(0, 60)
    .toLowerCase();
}
