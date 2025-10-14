// oxlint-disable sort-keys

import { vi } from "vitest";
import { translations_enGB } from "../translations";
import type { DatabaseService, StorageService } from "../types";
import type { Store } from "../utils/store";
import { mockAuthService, mockUser } from "./mock-auth-service";

export const mockStore: Store = {
  abortSignal: undefined,
  auth: mockAuthService,
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
  request: {} as Request,
  translation: translations_enGB,
  database: {} as DatabaseService,
  locale: "en",
  prefix: "/",
  storage: {} as StorageService,
  url: "http://localhost/",
  user: mockUser,
};
