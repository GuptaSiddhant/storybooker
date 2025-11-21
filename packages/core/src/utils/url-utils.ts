import { hc } from "hono/client";
import type { AppRouter } from "../routers/_app-router";
import { getStore } from "./store";

type HonoClient = ReturnType<typeof hc<AppRouter>>;

export function linkRoute(
  link: ((client: HonoClient) => URL) | URL | string,
  options: { baseUrl?: string; searchParams?: URLSearchParams } = {},
): string {
  const { baseUrl, searchParams } = options;

  if (typeof link === "string") {
    if (baseUrl !== undefined) {
      return appendSearchParamsToURL(
        new URL(link, baseUrl),
        searchParams,
      ).toString();
    }
    return link;
  }

  if (link instanceof URL) {
    return appendSearchParamsToURL(link, searchParams).toString();
  }

  const client = hc<AppRouter>(
    baseUrl ?? new URL(getStore().request.url).origin,
  );

  return appendSearchParamsToURL(link(client), searchParams).toString();
}

function appendSearchParamsToURL(
  url: URL,
  searchParams: URLSearchParams | undefined,
): URL {
  // oxlint-disable-next-line no-array-for-each
  searchParams?.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  return url;
}

export function urlSearchParamsToObject(
  query: URLSearchParams | FormData,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of query.keys()) {
    const values = query.getAll(key);
    // If multiple values for the same key, return array, else single value string
    result[key] = values.length > 1 ? values : values[0];
  }

  return result;
}

export function generatePrefixFromBaseRoute(
  baseRoute: string,
): `/${string}` | undefined {
  if (!baseRoute) {
    return undefined;
  }
  if (baseRoute.startsWith("/")) {
    return baseRoute as `/${string}`;
  }
  return `/${baseRoute}` as const;
}

export function urlJoin(...parts: string[]): string {
  if (parts.length === 0) {
    return "";
  }
  let protocol = "";
  let host = "";
  // Detect protocol + host in the first argument if present
  const match = parts[0]?.match(/^([a-zA-Z][a-zA-Z0-9+\-.]*:)?(\/\/[^/?#]*)?/);
  if (match && (match[1] || match[2])) {
    protocol = match[1] || ""; // e.g. "https:"
    host = match[2] || ""; // e.g. "//example.com"
    const remainder = parts[0]?.slice((match[0] || "").length);
    parts = remainder ? [remainder, ...parts.slice(1)] : parts.slice(1);
  }
  const segments: string[] = [];
  for (const part of parts) {
    for (const seg of part.split("/")) {
      if (!seg || seg === ".") {
        continue;
      }
      if (seg === "..") {
        // Don't pop past the beginning
        if (segments.length > 0) {
          segments.pop();
        }
      } else {
        segments.push(seg);
      }
    }
  }
  // Build the final URL
  let result = "";
  if (protocol || host) {
    result = protocol + host;
    if (segments.length > 0) {
      // Ensure separator slash between host and path
      result +=
        segments[0]?.startsWith("?") || segments[0]?.startsWith("#")
          ? ""
          : `/${segments.join("/")}`;
    }
  } else {
    result = `/${segments.join("/")}`;
  }
  return result;
}
