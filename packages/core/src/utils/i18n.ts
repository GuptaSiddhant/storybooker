import { getStore } from "#store";
import type { Translation } from "../translations";
import { toTitleCase } from "./text-utils";

export function getT<
  Category extends keyof Translation,
  Key extends keyof Translation[Category],
>(
  category: Category,
  key: Key,
  replacements?: Record<string, string>,
): Translation[Category][Key] {
  const value = getStore().translation[category][key];

  let translation: string = typeof value === "string" ? value : String(value);
  if (replacements) {
    for (const rep of Object.entries(replacements)) {
      translation = translation.replace(`{{${rep[0]}}}`, rep[1]);
    }
  }

  return translation as typeof value;
}

export const commonT = {
  Actions: (): string => toTitleCase(getT("dictionary", "actions")),
  All: (): string => toTitleCase(getT("dictionary", "all")),
  Author: (): string => toTitleCase(getT("dictionary", "author")),
  Build: (): string => toTitleCase(getT("dictionary", "build")),
  Builds: (): string => toTitleCase(getT("dictionary", "builds")),
  Cancel: (): string => toTitleCase(getT("dictionary", "cancel")),
  Clear: (): string => toTitleCase(getT("dictionary", "clear")),
  Create: (): string => toTitleCase(getT("dictionary", "create")),
  CreatedAt: (): string => toTitleCase(getT("dictionary", "created_at")),
  Delete: (): string => toTitleCase(getT("dictionary", "delete")),
  Details: (): string => toTitleCase(getT("dictionary", "details")),
  Download: (): string => toTitleCase(getT("dictionary", "download")),
  Edit: (): string => toTitleCase(getT("dictionary", "edit")),
  Email: (): string => toTitleCase(getT("dictionary", "email")),
  Filter: (): string => toTitleCase(getT("dictionary", "filter")),
  GitHub: (): string => "GitHub",
  Home: (): string => toTitleCase(getT("dictionary", "home")),
  ID: (): string => getT("dictionary", "id").toUpperCase(),
  Label: (): string => toTitleCase(getT("dictionary", "label")),
  Labels: (): string => toTitleCase(getT("dictionary", "labels")),
  Latest: (): string => toTitleCase(getT("dictionary", "latest")),
  Message: (): string => toTitleCase(getT("dictionary", "message")),
  Name: (): string => toTitleCase(getT("dictionary", "name")),
  Project: (): string => toTitleCase(getT("dictionary", "project")),
  Projects: (): string => toTitleCase(getT("dictionary", "projects")),
  Purge: (): string => toTitleCase(getT("dictionary", "purge")),
  Recent: (): string => toTitleCase(getT("dictionary", "recent")),
  Required: (): string => toTitleCase(getT("dictionary", "required")),
  Reset: (): string => toTitleCase(getT("dictionary", "reset")),
  Slug: (): string => toTitleCase(getT("dictionary", "slug")),
  StoryBook: (): string => "StoryBook",
  Type: (): string => toTitleCase(getT("dictionary", "type")),
  Update: (): string => toTitleCase(getT("dictionary", "update")),
  UpdatedAt: (): string => toTitleCase(getT("dictionary", "updated_at")),
  Upload: (): string => toTitleCase(getT("dictionary", "upload")),
  Variant: (): string => toTitleCase(getT("dictionary", "variant")),
  View: (): string => toTitleCase(getT("dictionary", "view")),
  ViewAll: (): string => toTitleCase(getT("dictionary", "view_all")),

  confirmDelete: (variant: string, name: string): string =>
    getT("confirmations", "delete", { name, variant }),
  confirmPurge: (): string => getT("confirmations", "purge"),
};
