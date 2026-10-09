import type {
  CatalogLocale,
  DiscoveryItem,
  StorefrontExperience,
} from "../catalog-discovery/types";
import { C, tr } from "./content";

export const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";
export function safeHref(value: unknown, fallback: string): string {
  const href = text(value);
  if (!href || /[\u0000-\u0020\\]/.test(href) || href.startsWith("//"))
    return fallback;
  if (href.startsWith("#")) return href;
  if (href.startsWith("/") && !href.split("/").includes("..")) return href;
  try {
    const url = new URL(href);
    return url.protocol === "https:" && !url.username && !url.password
      ? href
      : fallback;
  } catch {
    return fallback;
  }
}
export const baseHref = (locale: CatalogLocale) =>
  `/angelcare-marketplace/${locale}`;
export const itemHref = (item: DiscoveryItem, locale: CatalogLocale) =>
  `${baseHref(locale)}/marketplace/item/${encodeURIComponent(item.slug)}`;
export const searchHref = (experience: StorefrontExperience) => {
  const params = new URLSearchParams({ category: experience.key });
  if (experience.territoryCode)
    params.set("territory", experience.territoryCode);
  return `${baseHref(experience.locale)}/marketplace/search?${params}`;
};
export function canonicalItems(
  experience: StorefrontExperience,
): DiscoveryItem[] {
  const seen = new Set<string>();
  return experience.items.filter(
    (item) =>
      Boolean(item.id && item.slug) &&
      !seen.has(item.id) &&
      Boolean(seen.add(item.id)),
  );
}
export function canonicalSubset(
  items: readonly DiscoveryItem[],
  subset: readonly DiscoveryItem[],
): DiscoveryItem[] {
  const byId = new Map(items.map((item) => [item.id, item])),
    seen = new Set<string>();
  return subset.flatMap((item) => {
    const canonical = byId.get(item.id);
    if (!canonical || seen.has(item.id)) return [];
    seen.add(item.id);
    return [canonical];
  });
}
export const configuration = (item: DiscoveryItem) =>
  object(item.metadata.experience_configuration);
export const schemaKey = (item: DiscoveryItem) =>
  text(item.metadata.experience_schema_key);
export const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.flatMap((entry) => {
        if (typeof entry === "string") return [entry];
        const row = object(entry),
          title =
            text(row.label) ||
            text(row.name_fr) ||
            text(row.title) ||
            text(row.name);
        return title ? [title] : [];
      })
    : [];
export function publicContents(item: DiscoveryItem): string[] {
  const config = configuration(item);
  return [
    ...new Set(
      [
        "components",
        "included_items",
        "kit_contents",
        "learning_objectives",
        "competency_areas",
        "modules",
        "materials",
      ].flatMap((key) => stringList(config[key])),
    ),
  ].slice(0, 12);
}
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
export function ageRange(
  item: DiscoveryItem,
): { min: number; max: number } | null {
  const config = configuration(item);
  if (
    finite(config.age_min) &&
    finite(config.age_max) &&
    config.age_max >= config.age_min
  )
    return { min: config.age_min, max: config.age_max };
  if (
    finite(config.age_min_months) &&
    finite(config.age_max_months) &&
    config.age_max_months >= config.age_min_months
  )
    return { min: config.age_min_months / 12, max: config.age_max_months / 12 };
  return null;
}
export function priceLabel(
  item: Pick<DiscoveryItem, "price_amount" | "price_mode" | "currency_label">,
  locale: CatalogLocale,
): string {
  if (item.price_mode === "quote_only") return tr(C.quote, locale);
  if (
    item.price_amount === null ||
    !Number.isFinite(item.price_amount) ||
    item.price_amount < 0
  )
    return tr(C.noPrice, locale);
  const amount = new Intl.NumberFormat(`${locale}-MA`, {
    maximumFractionDigits: 2,
  }).format(item.price_amount);
  return `${item.price_mode === "starting_from" ? tr(C.from, locale) + " " : ""}${amount} ${item.currency_label}`;
}
export const unavailable = (item: DiscoveryItem) =>
  [
    "unavailable",
    "out_of_stock",
    "sold_out",
    "closed",
    "paused",
    "blocked",
  ].includes(item.availability_status);
export const availabilityLabel = (item: DiscoveryItem, locale: CatalogLocale) =>
  tr(
    item.availability_status === "available"
      ? C.available
      : item.availability_status === "limited"
        ? C.limited
        : unavailable(item)
          ? C.unavailable
          : C.conditions,
    locale,
  );
export function offerMedia(value: unknown): string | null {
  const src = text(value);
  if (
    !src ||
    (!src.startsWith("/") && !/^https?:\/\//.test(src)) ||
    src.startsWith("//") ||
    /[\u0000-\u001f]/.test(src)
  )
    return null;
  if (src.startsWith("/api/angelcare-marketplace/media/")) {
    const url = new URL(src, "https://angelcare.invalid");
    url.searchParams.delete("variant");
    return url.pathname + url.search;
  }
  return src;
}
export interface Filters {
  query: string;
  kind: string;
  availability: string;
  schema: string;
  age: string;
  sort: string;
}
export const INITIAL_FILTERS: Filters = {
  query: "",
  kind: "all",
  availability: "all",
  schema: "all",
  age: "all",
  sort: "recommended",
};
export function filterItems(
  items: readonly DiscoveryItem[],
  filters: Filters,
): DiscoveryItem[] {
  const query = filters.query.trim().toLocaleLowerCase();
  const age = filters.age === "all" ? null : Number(filters.age);
  const filtered = items.filter((item) => {
    const config = configuration(item);
    const searchable = [
      item.name,
      item.short_description || "",
      item.category_title || "",
      ...publicContents(item),
      text(config.format),
      text(config.delivery_mode),
    ]
      .join(" ")
      .toLocaleLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (filters.kind !== "all" && item.kind !== filters.kind) return false;
    if (
      filters.availability !== "all" &&
      item.availability_status !== filters.availability
    )
      return false;
    if (filters.schema !== "all" && schemaKey(item) !== filters.schema)
      return false;
    if (age !== null) {
      const range = ageRange(item);
      if (!range || age < range.min || age > range.max) return false;
    }
    return true;
  });
  if (filters.sort === "name")
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (filters.sort === "price_asc" || filters.sort === "price_desc")
    filtered.sort((a, b) => {
      const aa =
        a.price_mode === "quote_only" ||
        a.price_amount === null ||
        !Number.isFinite(a.price_amount)
          ? null
          : a.price_amount;
      const bb =
        b.price_mode === "quote_only" ||
        b.price_amount === null ||
        !Number.isFinite(b.price_amount)
          ? null
          : b.price_amount;
      return aa === null
        ? bb === null
          ? 0
          : 1
        : bb === null
          ? -1
          : filters.sort === "price_asc"
            ? aa - bb
            : bb - aa;
    });
  return filtered;
}
export function safeIds(value: string | null, allowed: Set<string>): string[] {
  try {
    const data: unknown = JSON.parse(value || "[]");
    return Array.isArray(data)
      ? [
          ...new Set(
            data.filter(
              (id): id is string => typeof id === "string" && allowed.has(id),
            ),
          ),
        ].slice(0, 80)
      : [];
  } catch {
    return [];
  }
}
