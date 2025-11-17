// oxlint-disable sort-keys

import type { BrandTheme } from "../../types";

export const DEFAULT_LIGHT_THEME: BrandTheme = {
  backgroundColor: {
    base: "#f2f2f2",
    card: "#ffffff",
    invert: "#000000",
    destructive: "#ff0000",
  },
  textColor: {
    primary: "#09090b",
    secondary: "#71717b",
    accent: "#2b7fff",
    invert: "#ffffff",
    destructive: "#ff0000",
  },
  borderColor: { default: "#e4e4e7" },
};

export const DEFAULT_DARK_THEME: BrandTheme = {
  backgroundColor: {
    base: "#09090b",
    card: "#18181b",
    invert: "#ffffff",
    destructive: "#ff0000",
  },
  textColor: {
    primary: "#fafafa",
    secondary: "#9f9fa9",
    accent: "#2b7fff",
    invert: "#000000",
    destructive: "#ff0000",
  },
  borderColor: { default: "#ffffff1a" },
};
