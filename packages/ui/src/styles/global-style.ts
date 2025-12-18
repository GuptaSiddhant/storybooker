// @ts-expect-error importing raw css file to embed in generated stylesheet
import globalStyles from "./global.css?raw";
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, type BrandTheme } from "./theme";

// oxlint-disable no-useless-escape
export function generateGlobalStyleSheet(theme: {
  darkTheme: BrandTheme | undefined;
  lightTheme: BrandTheme | undefined;
}): string {
  const { darkTheme = DEFAULT_DARK_THEME, lightTheme = DEFAULT_LIGHT_THEME } = theme || {};

  return /* css */ `
    :root {
      --color-bg-base: ${lightTheme.backgroundColor.base};
      --color-bg-card:${lightTheme.backgroundColor.card};
      --color-bg-invert:${lightTheme.backgroundColor.invert};
      --color-bg-destructive:${lightTheme.backgroundColor.destructive};
      --color-text-primary:${lightTheme.textColor.primary};
      --color-text-secondary: ${lightTheme.textColor.secondary};
      --color-text-accent: ${lightTheme.textColor.accent};
      --color-text-invert: ${lightTheme.textColor.invert};
      --color-text-destructive: ${lightTheme.textColor.destructive};
      --color-border: ${lightTheme.borderColor.default};
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --color-bg-base: ${darkTheme.backgroundColor.base};
        --color-bg-card:${darkTheme.backgroundColor.card};
        --color-bg-invert:${darkTheme.backgroundColor.invert};
        --color-bg-destructive:${darkTheme.backgroundColor.destructive};
        --color-text-primary:${darkTheme.textColor.primary};
        --color-text-secondary: ${darkTheme.textColor.secondary};
        --color-text-accent: ${darkTheme.textColor.accent};
        --color-text-invert: ${darkTheme.textColor.invert};
        --color-text-destructive: ${darkTheme.textColor.destructive};
        --color-border: ${darkTheme.borderColor.default};
      }
    }
    
    ${globalStyles}
  `.replaceAll(/\s+/g, " ");
}
