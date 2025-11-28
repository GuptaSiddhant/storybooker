// oxlint-disable sort-keys

import { SuperHeaders } from "@remix-run/headers";
import { vi } from "vitest";
import type { DatabaseAdapter, StorageAdapter } from "../adapters";
import type { Store } from "../utils/store";
import { mockAuthService, mockUser } from "./mock-auth-service";

export const mockStore: Store = {
  abortSignal: undefined,
  auth: mockAuthService,
  headers: new SuperHeaders(),
  logger: {
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
