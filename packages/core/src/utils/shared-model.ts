import z from "zod";
import type {
  DatabaseService,
  DatabaseServiceOptions,
  LoggerService,
  PermissionAction,
  StorageService,
  StorageServiceOptions,
} from "../types";
import { getStore } from "../utils/store";
import { PATTERNS, SERVICE_NAME } from "./constants";
import { parseErrorMessage } from "./error";

type Obj = Record<string, unknown>;

export interface ListOptions<Item extends Record<string, unknown>> {
  limit?: number;
  filter?: string | ((item: Item) => boolean);
  select?: string[];
  sort?: "latest" | ((item1: Item, item2: Item) => number);
}

export abstract class Model<Data extends Obj> implements BaseModel<Data> {
  projectId: string;
  collectionId: string;
  database: DatabaseService;
  storage: StorageService;
  logger: LoggerService;
  dbOptions: DatabaseServiceOptions;
  storageOptions: StorageServiceOptions;

  constructor(projectId: string | null, collectionId: string) {
    const { abortSignal, database, storage, logger } = getStore();
    this.projectId = projectId || "";
    this.collectionId = collectionId;
    this.database = database;
    this.storage = storage;
    this.logger = logger;
    this.dbOptions = { abortSignal, logger };
    this.storageOptions = { abortSignal, logger };
  }

  log(message: string, ...args: unknown[]): void {
    this.logger.log(`[Model:${this.projectId || "All"}] ${message}`, ...args);
  }
  debug(message: string, ...args: unknown[]): void {
    this.logger.debug?.(
      `[Model:${this.projectId || "All"}] ${message}`,
      ...args,
    );
  }
  error(error: unknown, ...args: unknown[]): void {
    const { errorMessage } = parseErrorMessage(error);
    this.logger.error(
      `[Model:${this.projectId || "All"}] Error:`,
      errorMessage,
      ...args,
    );
  }

  abstract list(options?: ListOptions<Data>): Promise<Data[]>;
  abstract create(data: unknown): Promise<Data>;
  abstract get(id: string): Promise<Data>;
  abstract has(id: string): Promise<boolean>;
  abstract update(id: string, data: unknown): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract id: (id: string) => BaseIdModel<Data>;
  abstract checkAuth(action: PermissionAction): Promise<boolean>;
}

export interface BaseModel<Data extends Obj> {
  list(options?: ListOptions<Data>): Promise<Data[]>;
  create(data: unknown): Promise<Data>;
  get(id: string): Promise<Data>;
  has(id: string): Promise<boolean>;
  update(id: string, data: unknown): Promise<void>;
  delete(id: string): Promise<void>;
  checkAuth(action: PermissionAction): Promise<boolean>;
  id: (id: string) => BaseIdModel<Data>;
}

export interface BaseIdModel<Data extends Obj> {
  id: string;
  get(): Promise<Data>;
  has(): Promise<boolean>;
  update(data: unknown): Promise<void>;
  delete(): Promise<void>;
  checkAuth(action: PermissionAction): Promise<boolean>;
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
export const TagSlugSchema = z
  .string()
  .meta({ description: "The slug of the tag.", id: "tagSlug" });

/** @private */
export const EmptyObjectSchema = z.object();

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
