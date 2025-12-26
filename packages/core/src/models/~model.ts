import type { StoryBookerPermissionAction } from "../adapters/_internal/auth.ts";
import type {
  DatabaseAdapter,
  DatabaseAdapterOptions,
  StoryBookerDatabaseDocument,
} from "../adapters/_internal/database.ts";
import type { LoggerAdapter } from "../adapters/_internal/logger.ts";
import type { StorageAdapter, StorageAdapterOptions } from "../adapters/_internal/storage.ts";
import { parseErrorMessage } from "../utils/error.ts";
import { getStore } from "../utils/store.ts";

export interface ListOptions<Item extends Record<string, unknown>> {
  limit?: number;
  filter?: string | ((item: Item) => boolean);
  select?: string[];
  sort?: "latest" | ((item1: Item, item2: Item) => number);
}

export abstract class Model<Data extends StoryBookerDatabaseDocument> implements BaseModel<Data> {
  projectId: string;
  collectionId: string;
  database: DatabaseAdapter<Data>;
  storage: StorageAdapter;
  logger: LoggerAdapter;
  dbOptions: DatabaseAdapterOptions;
  storageOptions: StorageAdapterOptions;

  constructor(projectId: string | null, collectionId: string) {
    const { abortSignal, database, storage, logger } = getStore();
    this.projectId = projectId ?? "";
    this.collectionId = collectionId;
    this.database = database as unknown as DatabaseAdapter<Data>;
    this.storage = storage;
    this.logger = logger;
    this.dbOptions = { abortSignal, logger };
    this.storageOptions = { abortSignal, logger };
  }

  log(message: string, ...args: unknown[]): void {
    this.logger.log(`[Model:${this.projectId || "All"}] ${message}`, ...args);
  }
  debug(message: string, ...args: unknown[]): void {
    this.logger.debug?.(`[Model:${this.projectId || "All"}] ${message}`, ...args);
  }
  error(error: unknown, ...args: unknown[]): void {
    const { errorMessage } = parseErrorMessage(error);
    this.logger.error(`[Model:${this.projectId || "All"}] Error:`, errorMessage, ...args);
  }

  abstract list(options?: ListOptions<Data>): Promise<Data[]>;
  abstract create(data: unknown): Promise<Data>;
  abstract get(id: string): Promise<Data>;
  abstract has(id: string): Promise<boolean>;
  abstract update(id: string, data: unknown): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract id: (id: string) => BaseIdModel<Data>;
  abstract checkAuth(action: StoryBookerPermissionAction): boolean;
}

export interface BaseModel<Data extends StoryBookerDatabaseDocument> {
  list(options?: ListOptions<Data>): Promise<Data[]>;
  create(data: unknown): Promise<Data>;
  get(id: string): Promise<Data>;
  has(id: string): Promise<boolean>;
  update(id: string, data: unknown): Promise<void>;
  delete(id: string): Promise<void>;
  checkAuth(action: StoryBookerPermissionAction): boolean;
  id: (id: string) => BaseIdModel<Data>;
}

export interface BaseIdModel<Data extends StoryBookerDatabaseDocument> {
  id: string;
  get(): Promise<Data>;
  has(): Promise<boolean>;
  update(data: unknown): Promise<void>;
  delete(): Promise<void>;
  checkAuth(action: StoryBookerPermissionAction): boolean;
}
