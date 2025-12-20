import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockUser } from "../mocks/mock-auth-service";
import { mockStore } from "../mocks/mock-store";
import { authenticateOrThrow, checkAuthorisation } from "./auth";
import { getStore } from "./store";

vi.mock("./store");

describe("authenticateOrThrow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows all actions if no auth service", () => {
    vi.mocked(getStore).mockReturnValue({ ...mockStore, auth: undefined });
    const actual = authenticateOrThrow({
      resource: "build",
      action: "delete",
    });

    expect(actual).toBeUndefined();
  });

  it("throws 401 if user is missing", () => {
    vi.mocked(getStore).mockReturnValue({
      ...mockStore,
      user: null,
    });

    expect(() => {
      authenticateOrThrow({ resource: "build", action: "delete" });
    }).toThrow(HTTPException);
  });

  it("returns if auth.authorise returns true", () => {
    vi.mocked(getStore).mockReturnValue(mockStore);
    expect(authenticateOrThrow({ resource: "build", action: "delete" })).toBeUndefined();
  });

  it("throws 403 if user is not authorised", () => {
    vi.mocked(getStore).mockReturnValue({
      ...mockStore,
      user: { ...mockUser, permissions: { ...mockUser.permissions, "build:delete": false } },
    });

    expect(() => {
      authenticateOrThrow({ resource: "build", action: "delete" });
    }).toThrow(HTTPException);
  });
});

describe("checkAuthorisation", () => {
  it("returns true if no auth service", () => {
    vi.mocked(getStore).mockReturnValue({ ...mockStore, auth: undefined });
    expect(checkAuthorisation({ resource: "build", action: "delete" })).toBe(true);
  });

  it("returns true if user is authorised", () => {
    vi.mocked(getStore).mockReturnValue(mockStore);
    expect(checkAuthorisation({ resource: "build", action: "delete" })).toBe(true);
  });

  it("returns false if user is not authorised", () => {
    vi.mocked(getStore).mockReturnValue({
      ...mockStore,
      user: { ...mockUser, permissions: { ...mockUser.permissions, "build:delete": false } },
    });
    expect(checkAuthorisation({ resource: "build", action: "delete" })).toBe(false);
  });
});
