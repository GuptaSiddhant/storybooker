import type { Store } from "@storybooker/core/store";
import { describe, expect, it, vi } from "vitest";
import { mockStore } from "../mocks/mock-store";
import { commonT, getT } from "./i18n";

vi.mock("../@storybooker/core/store", () => ({
  getStore: (): Store => mockStore,
}));

describe("i18n", () => {
  it("should get translation value", () => {
    const value = getT("dictionary", "actions");
    expect(value).toBe("actions");
  });
  it("should replace values in translation", () => {
    const value = getT("confirmations", "delete", {
      name: "Test Project",
      variant: "Project",
    });
    expect(value).toBe(
      "Are you sure about deleting the Project 'Test Project'?",
    );
  });
});

describe("commonT", () => {
  it("should get common translation value", () => {
    const value = commonT.confirmDelete("Project", "Test Project");
    expect(value).toBe(
      "Are you sure about deleting the Project 'Test Project'?",
    );
  });
});
