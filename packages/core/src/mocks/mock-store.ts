// oxlint-disable sort-keys

import { SuperHeaders } from "@remix-run/headers";
import type { DatabaseAdapter, StorageAdapter } from "@storybooker/adapter";
import { vi } from "vitest";
import { translations_enGB } from "../ui/translations";
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
  translation: translations_enGB,
  database: {} as DatabaseAdapter,
  locale: "en",
  prefix: "/",
  storage: {} as StorageAdapter,
  url: "http://localhost/",
  user: mockUser,
};
