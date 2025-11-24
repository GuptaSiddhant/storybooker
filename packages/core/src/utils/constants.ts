export const SERVICE_NAME = "StoryBooker";
export const SERVICE_SHORT_NAME = "SBR";
export const CACHE_CONTROL_PUBLIC_YEAR = "public, max-age=31536000, immutable";
export const CACHE_CONTROL_PUBLIC_WEEK = "public, max-age=604800, immutable";
export const DEFAULT_PURGE_AFTER_DAYS = 30;
export const DEFAULT_GITHUB_BRANCH = "main";
export const ONE_DAY_IN_MS: number = 24 * 60 * 60 * 1000;
export const DEFAULT_LOCALE = "en";
export const DEFAULT_STATIC_DIRS = ["./public"];
export const ISO_DATE_REGEXP =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/;

export const QUERY_PARAMS = {
  tagId: "tagId",
  uploadVariant: "variant",
  redirect: "redirect",
} as const;

export const PATTERNS = {
  projectId: {
    message: "Should contain only lowercase alphabets, numbers and hyphen.",
    pattern: "^[a-z0-9][a-z0-9-]{0,60}$",
  },
} satisfies Record<
  string,
  {
    pattern: string | RegExp;
    patternGlobal?: string | RegExp;
    message?: string;
  }
>;

export const ASSETS = {
  globalStyles: "sbr-style.css",
  globalScript: "sbr-script.js",
  globalSprite: "sbr-sprite.svg",
};

export const TagTypes = ["branch", "pr", "jira"] as const;
