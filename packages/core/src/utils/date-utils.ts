import { getStore } from "./store";

export function renderLocalTime(
  value: string | Date | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const { locale } = getStore();

  return new Date(value).toLocaleString(locale, options);
}
