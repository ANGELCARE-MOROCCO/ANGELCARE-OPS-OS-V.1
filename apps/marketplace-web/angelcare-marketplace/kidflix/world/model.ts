import {
  path,
  WORLDS,
  type Catalogue,
  type Locale,
  type Resource,
} from "../catalogue";

export const QUERY_KEYS = [
  "q",
  "family",
  "notFamily",
  "intent",
  "subject",
  "skill",
  "difficulty",
  "audience",
  "age",
  "duration",
  "format",
  "sort",
  "keys",
  "page",
] as const;
export type DiscoveryFilters = Record<string, string>;
export function discoveryFilters(
  input: Record<string, unknown>,
  family?: string,
): DiscoveryFilters {
  const out: DiscoveryFilters = {};
  for (const key of QUERY_KEYS) {
    const value = input[key];
    if (typeof value === "string" && value.trim())
      out[key] = value.trim().slice(0, key === "keys" ? 12000 : 100);
  }
  if (family) out.family = family;
  out.page = String(
    Math.max(1, Math.min(10000, Math.floor(Number(out.page) || 1))),
  );
  if (out.format) out.format = out.format.toUpperCase();
  return out;
}
export function discoveryHref(
  locale: Locale,
  values: DiscoveryFilters,
  family?: string,
) {
  const query = new URLSearchParams();
  for (const key of QUERY_KEYS)
    if (
      values[key] &&
      !(family && key === "family") &&
      !(key === "page" && values[key] === "1")
    )
      query.set(key, values[key]);
  return (
    path(locale, family ? "/explore/" + family : "/explore") +
    (query.size ? "?" + query : "")
  );
}
export function localizedHref(
  pathname: string,
  query: string,
  locale: Locale,
  hash = "",
) {
  const current = /^\/kidflix\/(en|fr|ar)(?=\/|$)/.test(pathname)
    ? pathname
    : path(locale);
  return (
    current.replace(/^\/kidflix\/(en|fr|ar)(?=\/|$)/, "/kidflix/" + locale) +
    (query ? "?" + query : "") +
    (hash.startsWith("#") ? hash : "")
  );
}
export function routeFamily(pathname: string) {
  const match = pathname.match(
    /^\/kidflix\/(?:en|fr|ar)\/explore\/([^/]+)\/?$/,
  );
  return match && WORLDS.some((w) => w.key === match[1]) ? match[1] : undefined;
}
export function readCatalogue(value: unknown): Catalogue {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("INVALID_CATALOGUE");
  const v = value as Record<string, unknown>;
  if (
    v.error ||
    !Array.isArray(v.rows) ||
    typeof v.total !== "number" ||
    !Number.isFinite(v.total) ||
    v.total < 0
  )
    throw Error("INVALID_CATALOGUE");
  for (const entry of v.rows) {
    const r = entry as Partial<Resource> | null;
    if (
      !r ||
      typeof r.key !== "string" ||
      !r.key ||
      typeof r.title !== "string" ||
      !r.title.trim() ||
      !WORLDS.some((w) => w.key === r.family) ||
      !Array.isArray(r.formats) ||
      !r.formats.every((f) => typeof f === "string") ||
      !Array.isArray(r.skills) ||
      !r.skills.every((s) => typeof s === "string")
    )
      throw Error("INVALID_RESOURCE");
  }
  const strings = (items: unknown) =>
    Array.isArray(items)
      ? items.filter((v): v is string => typeof v === "string")
      : [];
  const counts: Record<string, number> = {};
  if (v.counts && typeof v.counts === "object" && !Array.isArray(v.counts))
    for (const [key, n] of Object.entries(v.counts))
      if (
        WORLDS.some((w) => w.key === key) &&
        typeof n === "number" &&
        Number.isFinite(n) &&
        n >= 0
      )
        counts[key] = n;
  return {
    rows: v.rows as Resource[],
    total: Math.floor(v.total),
    page: Math.max(1, Number(v.page) || 1),
    pageSize: Math.max(1, Number(v.pageSize) || 24),
    counts,
    subjects: strings(v.subjects),
    skills: strings(v.skills),
    configured: v.configured === true,
  };
}
