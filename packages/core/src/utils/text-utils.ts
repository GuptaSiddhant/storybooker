export function toTitleCase(text: string): string {
  return `${text.slice(0, 1).toUpperCase()}${text.slice(1)}`;
}

export function camelCaseToSentenceCase(text: string): string {
  // Insert a space before all uppercase letters
  const result = text.replaceAll(/([A-Z])/g, " $1");
  // Lowercase the entire result and capitalize the first letter
  return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
}
