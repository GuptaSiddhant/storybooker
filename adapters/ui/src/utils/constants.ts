export const DEFAULT_STATIC_DIRS = ["./public"];

export const CACHE_CONTROL_PUBLIC_WEEK = "public, max-age=604800, immutable";

export const ISO_DATE_REGEXP =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/;

export const ASSETS = {
  globalStyles: "sbr-style.css",
  globalSprite: "sbr-sprite.svg",
};

export const TEXTS = {
  confirmDelete: "Are you sure about deleting the {{variant}} '{{name}}'?",
};
