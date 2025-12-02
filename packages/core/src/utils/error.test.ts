import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { mockStore } from "../mocks/mock-store";
import { parseErrorMessage } from "./error";

// Mock #store and getStoreOrNull
vi.mock("./store", () => ({
  getStoreOrNull: vi.fn(),
}));

const { getStoreOrNull } = await import("./store");

describe("parseErrorMessage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns custom error if errorParser is provided", () => {
    const customParser = vi.fn().mockReturnValue({
      errorMessage: "custom",
      errorType: "custom",
    });
    const result = parseErrorMessage("err", customParser);
    expect(result).toEqual({ errorMessage: "custom", errorType: "custom" });
    expect(customParser).toHaveBeenCalledWith("err");
  });

  it("returns custom error if errorParser from store is provided", () => {
    vi.mocked(getStoreOrNull).mockReturnValue({
      ...mockStore,
      errorParser: vi.fn().mockReturnValue({
        errorMessage: "store",
        errorType: "store",
      }),
    });
    const result = parseErrorMessage("err");
    expect(result).toEqual({ errorMessage: "store", errorType: "store" });
  });

  it("returns string error", () => {
    vi.mocked(getStoreOrNull).mockReturnValue(mockStore);
    const result = parseErrorMessage("simple error");
    expect(result).toEqual({
      errorMessage: "simple error",
      errorType: "string",
    });
  });

  it("returns Zod error", () => {
    vi.mocked(getStoreOrNull).mockReturnValue(mockStore);
    const schema = z.object({ foo: z.string() });
    let newError: unknown = null;
    try {
      schema.parse({ foo: 123 });
    } catch (error) {
      newError = error;
    }

    const result = parseErrorMessage(newError);
    expect(result).toEqual({
      errorMessage: "✖ Invalid input: expected string, received number\n  → at foo",
      errorStatus: 400,
      errorType: "Zod",
    });
  });

  it("returns Error object", () => {
    vi.mocked(getStoreOrNull).mockReturnValue(mockStore);
    const err = new Error("fail");
    const result = parseErrorMessage(err);
    expect(result).toEqual({ errorMessage: "fail", errorType: "error" });
  });

  it("returns error with message property", () => {
    vi.mocked(getStoreOrNull).mockReturnValue(mockStore);
    const err = { message: "msg" };
    const result = parseErrorMessage(err);
    expect(result).toEqual({ errorMessage: "msg", errorType: "error" });
  });

  it("returns unknown error", () => {
    vi.mocked(getStoreOrNull).mockReturnValue(mockStore);
    const result = parseErrorMessage(12_345);
    expect(result).toEqual({ errorMessage: "12345", errorType: "unknown" });
  });
});
