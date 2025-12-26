// oxlint-disable sort-keys

import { SuperHeaders } from "@remix-run/headers";
import { vi } from "vitest";
import type { DatabaseAdapter } from "../adapters/_internal/database.ts";
import type { StorageAdapter } from "../adapters/_internal/storage.ts";
import type { Store } from "../utils/store.ts";
import { mockAuthService, mockUser } from "./mock-auth-service";

export const mockStore: Store = {
  abortSignal: undefined,
  auth: mockAuthService(),
  headers: new SuperHeaders(),
  logger: {
    metadata: { name: "Mock Logger" },
    debug: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
  request: {} as Request,
  database: {} as DatabaseAdapter,
  locale: "en",
  prefix: "/",
  storage: {} as StorageAdapter,
  url: "http://localhost/",
  user: mockUser,
};
