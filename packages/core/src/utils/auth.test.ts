// oxlint-disable require-await
// oxlint-disable explicit-function-return-type
// oxlint-disable no-empty-function

import { getStore } from "#store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockAuthService } from "../mocks/mock-auth-service";
import { mockStore } from "../mocks/mock-store";
import { authenticateOrThrow, checkAuthorisation } from "./auth";

vi.mock("#store");

describe("authenticateOrThrow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows all actions if no auth service", async () => {
    vi.mocked(getStore).mockReturnValue({ ...mockStore, auth: undefined });
    await expect(
      authenticateOrThrow({
        resource: "build",
        action: "delete",
        projectId: undefined,
      }),
    ).resolves.toBeUndefined();
  });

  it("throws 401 if user is missing", async () => {
    vi.mocked(getStore).mockReturnValue({
      ...mockStore,
      user: null,
    });

    await expect(
      authenticateOrThrow({
        resource: "build",
        action: "delete",
        projectId: undefined,
      }),
    ).rejects.toThrow(Response);
  });

  it("returns if auth.authorise returns true", async () => {
    vi.mocked(getStore).mockReturnValue(mockStore);
    await expect(
      authenticateOrThrow({
        resource: "build",
        action: "delete",
        projectId: undefined,
      }),
    ).resolves.toBeUndefined();
  });

  it("throws 403 if auth.authorise returns false", async () => {
    vi.mocked(getStore).mockReturnValue({
      ...mockStore,
      auth: { ...mockAuthService, authorise: vi.fn().mockResolvedValue(false) },
    });

    await expect(
      authenticateOrThrow({
        resource: "build",
        action: "delete",
        projectId: undefined,
      }),
    ).rejects.toThrow(Response);
  });

  it("throws if auth.authorise returns a response", async () => {
    vi.mocked(getStore).mockReturnValue({
      ...mockStore,
      auth: {
        ...mockAuthService,
        authorise: vi.fn().mockResolvedValue(new Response(null)),
      },
    });
    await expect(
      authenticateOrThrow({
        resource: "build",
        action: "delete",
        projectId: undefined,
      }),
    ).rejects.toBeInstanceOf(Response);
  });

  it("throws 403 if auth.authorise throws", async () => {
    vi.mocked(getStore).mockReturnValue({
      ...mockStore,
      auth: {
        ...mockAuthService,
        authorise: vi.fn().mockRejectedValue(new Error("fail")),
      },
    });

    await expect(
      authenticateOrThrow({
        resource: "build",
        action: "delete",
        projectId: undefined,
      }),
    ).rejects.toThrow(Response);
  });
});

describe("checkAuthorisation", () => {
  it("returns true if no auth service", async () => {
    vi.mocked(getStore).mockReturnValue({ ...mockStore, auth: undefined });
    await expect(
      checkAuthorisation({
        resource: "build",
        action: "delete",
        projectId: undefined,
      }),
    ).resolves.toBe(true);
  });

  it("returns true if user is authorised", async () => {
    vi.mocked(getStore).mockReturnValue(mockStore);
    await expect(
      checkAuthorisation({
        resource: "build",
        action: "delete",
        projectId: undefined,
      }),
    ).resolves.toBe(true);
  });

  it("returns false if user is not authorised", async () => {
    vi.mocked(getStore).mockReturnValue({
      ...mockStore,
      auth: { ...mockAuthService, authorise: vi.fn().mockResolvedValue(false) },
    });
    await expect(
      checkAuthorisation({
        resource: "build",
        action: "delete",
        projectId: undefined,
      }),
    ).resolves.toBe(false);
  });
});
