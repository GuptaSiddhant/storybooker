import { getStore } from "@storybooker/core/store";
import { TEXTS } from "./constants";

export function toTitleCase(text: string): string {
  return `${text.slice(0, 1).toUpperCase()}${text.slice(1)}`;
}

export function camelCaseToSentenceCase(text: string): string {
  // Insert a space before all uppercase letters
  const result = text.replaceAll(/([A-Z])/g, " $1");
  // Lowercase the entire result and capitalize the first letter
  return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
}

export function toLocalTime(
  value: string | Date | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const { locale } = getStore();

  return new Date(value).toLocaleString(locale, options);
}

export function getText(
  input: string,
  replacements: Record<string, string>,
): string {
  let translation: string = typeof input === "string" ? input : String(input);
  if (replacements) {
    for (const rep of Object.entries(replacements)) {
      translation = translation.replace(`{{${rep[0]}}}`, rep[1]);
    }
  }

  return translation;
}

export function confirmDelete(variant: string, name: string): string {
  return getText(TEXTS.confirmDelete, {
    variant,
    name,
  });
}
