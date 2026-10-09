import type {
  HomepageExperience,
  HomepageItem,
  HomepageLocale,
} from "../../homepage-flagship/types";

export type Need = "all" | "care" | "baby" | "learn" | "play" | "professional";
export type Rhythm = "all" | "once" | "recurring" | "night" | "pickup";
export type Age = "all" | "0-2" | "3-5" | "6-8" | "9-12";
export type Goal =
  | "all"
  | "language"
  | "autonomy"
  | "creativity"
  | "concentration";
export interface Discovery {
  need: Need;
  rhythm: Rhythm;
  age: Age;
  goal: Goal;
  query: string;
  category: string;
  available: boolean;
  sort: "curated" | "price-low" | "price-high";
}
export const INITIAL_DISCOVERY: Discovery = {
  need: "all",
  rhythm: "all",
  age: "all",
  goal: "all",
  query: "",
  category: "",
  available: false,
  sort: "curated",
};
export const HOME_MODULES = [
  "campaign",
  "hero",
  "actions",
  "worlds",
  "discovery",
  "family",
  "services",
  "rhythms",
  "development",
  "kits",
  "gallery",
  "ages",
  "selections",
  "pairings",
  "taxonomy",
  "collections",
  "comparison",
  "academy",
  "professional",
  "continue",
  "guidance",
  "trust",
  "faq",
  "finale",
] as const;
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export const configuration = (item: HomepageItem) => ({
  ...record(item.metadata.experience_configuration),
  ...record(item.experience_configuration),
});
export function canonicalItems(experience: HomepageExperience): HomepageItem[] {
  // An explicitly empty canonical catalogue must remain empty. Collections cannot add inventory.
  const source =
    experience.catalogItems ??
    [
      experience.featuredItems,
      experience.availableItems,
      experience.popularItems,
      experience.bestPickItems,
      experience.newArrivalItems,
      experience.familyItems,
      experience.developmentItems,
      experience.academyItems,
      experience.organizationItems,
    ].flat();
  const map = new Map<string, HomepageItem>();
  for (const item of source)
    if (item.id && item.slug && !map.has(item.id)) map.set(item.id, item);
  return [...map.values()];
}
export function canonicalSubset(
  source: readonly HomepageItem[],
  canonical: readonly HomepageItem[],
) {
  const byId = new Map(canonical.map((item) => [item.id, item]));
  return [...new Set(source.map((item) => item.id))].flatMap((id) =>
    byId.has(id) ? [byId.get(id)!] : [],
  );
}
export function canonicalCollections(
  experience: HomepageExperience,
  items: readonly HomepageItem[],
) {
  return experience.collections
    .map((collection) => ({
      ...collection,
      items: canonicalSubset(collection.items, items),
    }))
    .filter((collection) => collection.items.length > 0);
}
export function schema(item: HomepageItem): string {
  const explicit =
    item.experience_schema_key || item.metadata.experience_schema_key;
  if (typeof explicit === "string" && explicit) return explicit;
  // Legacy placement is allowed only with an explicit family assignment and a compatible sellable type.
  if (
    item.metadata.family_storefront_assignment !== true ||
    item.kind !== "service"
  )
    return "";
  const type = item.metadata.family_sellable_type;
  if (!["one_time_service", "recurring_service"].includes(String(type)))
    return "";
  switch (item.metadata.family_service_capability) {
    case "advanced-childcare":
      return type === "recurring_service"
        ? "home-childcare-recurring"
        : "home-childcare-one-time";
    case "home-care-postpartum":
      return "postpartum";
    case "advanced-awakening-home":
      return "home-activities";
    case "special-needs-home-support":
      return "non-medical-support-service";
    default:
      return "";
  }
}
const CARE = [
  "home-childcare-one-time",
  "home-childcare-recurring",
  "school-pickup-care",
  "overnight-extended-care",
  "emergency-last-minute-care",
  "hotel-travel-childcare",
];
const LEARN = [
  "montessori-home-service",
  "learning-homework-support",
  "home-activities",
  "flashcards-learning-product",
  "development-game",
  "digital-learning-resource",
  "montessori-development-kit",
];
const PROFESSIONAL_SCHEMAS = [
  "school-managed-programme",
  "school-staff-reinforcement",
  "hospitality-kids-programme",
  "corporate-childcare-benefit",
  "health-adjacent-programme",
  "event-venue-programme",
  "partner-os-plan",
  "quality-check-assessment",
  "custom-managed-solution",
];
export function matchesNeed(item: HomepageItem, need: Need) {
  if (need === "all") return true;
  const key = schema(item);
  if (need === "care") return item.kind === "service" && CARE.includes(key);
  if (need === "baby") return item.kind === "service" && key === "postpartum";
  if (need === "learn")
    return (
      ["product", "kit", "service"].includes(item.kind) && LEARN.includes(key)
    );
  if (need === "play") return item.kind === "product" || item.kind === "kit";
  return (
    item.kind === "audit" ||
    item.kind === "saas_module" ||
    PROFESSIONAL_SCHEMAS.includes(key) ||
    item.metadata.audience === "organization" ||
    [
      "establishments",
      "institutions",
      "hospitality",
      "health-partners",
      "corporates",
      "corporate",
      "partner-os",
      "quality-check",
      "quality",
      "professionals",
    ].includes(item.category_key || "")
  );
}
export function developmentPool(
  experience: HomepageExperience,
  items: readonly HomepageItem[],
) {
  const explicit = items.filter(
    (item) =>
      matchesNeed(item, "learn") ||
      ["development", "kits"].includes(item.category_key || ""),
  );
  return canonicalSubset([...experience.developmentItems, ...explicit], items);
}
export function professionalPool(
  experience: HomepageExperience,
  items: readonly HomepageItem[],
) {
  return canonicalSubset(
    [
      ...experience.organizationItems,
      ...items.filter((item) => matchesNeed(item, "professional")),
    ],
    items,
  );
}
export function matchesRhythm(item: HomepageItem, rhythm: Rhythm) {
  if (rhythm === "all") return true;
  return (
    item.kind === "service" &&
    schema(item) ===
      (
        {
          once: "home-childcare-one-time",
          recurring: "home-childcare-recurring",
          night: "overnight-extended-care",
          pickup: "school-pickup-care",
        } as const
      )[rhythm]
  );
}
export function ageRanges(item: HomepageItem): Array<[number, number]> {
  const c = configuration(item),
    detail = record(item.metadata.family_card_details),
    v = { ...c, ...detail };
  const number = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value)
      ? value
      : typeof value === "string" && /^\d+(\.\d+)?$/.test(value)
        ? Number(value)
        : null;
  const min = number(v.age_min),
    max = number(v.age_max);
  // Only explicit year-based bounds: months are never interpreted as years.
  if (
    min !== null &&
    max !== null &&
    min >= 0 &&
    max >= min &&
    max <= 18 &&
    !/month|mois|شهر/.test(String(v.age_unit || ""))
  )
    return [[min, max]];
  const source = v.child_age_bands ?? v.age_range ?? v.age_bands;
  const values = Array.isArray(source)
    ? source
    : typeof source === "string"
      ? source.split(/[|,;]/)
      : [];
  return values.flatMap((value) => {
    if (typeof value !== "string") return [];
    const match = value
      .trim()
      .match(
        /^(?:ages?\s*)?(\d{1,2})\s*(?:-|–|—|to|à|إلى)\s*(\d{1,2})(?:\s*(?:ans?|years?|سنوات|سنة))?$/i,
      );
    if (!match) return [];
    const a = Number(match[1]),
      b = Number(match[2]);
    return a <= b && b <= 18 ? [[a, b] as [number, number]] : [];
  });
}
export function matchesAge(item: HomepageItem, age: Age) {
  if (age === "all") return true;
  const [min, max] = age.split("-").map(Number);
  return ageRanges(item).some(([a, b]) => a <= max && b >= min);
}
export const strings = (value: unknown): string[] =>
  (Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : typeof value === "string"
      ? value.split(/[|,;]/)
      : []
  )
    .map((value) => value.trim())
    .filter(Boolean);
const GOALS: Record<Exclude<Goal, "all">, readonly string[]> = {
  language: [
    "language",
    "language_development",
    "langage",
    "communication",
    "لغة",
    "اللغة",
  ],
  autonomy: [
    "autonomy",
    "autonomie",
    "independence",
    "practical_life",
    "vie pratique",
    "الاستقلالية",
  ],
  creativity: ["creativity", "créativité", "creative", "art", "الإبداع"],
  concentration: ["concentration", "attention", "focus", "التركيز"],
};
export function matchesGoal(item: HomepageItem, goal: Goal) {
  if (goal === "all") return true;
  const c = configuration(item);
  return [
    c.competency_areas,
    c.competency_domains,
    c.learning_domains,
    c.developmental_areas,
    c.learning_objectives,
  ]
    .flatMap(strings)
    .some((value) => GOALS[goal].includes(value.toLocaleLowerCase()));
}
export const canPurchase = (item: HomepageItem) =>
  ["available", "limited"].includes(item.availability_status);
export function discover(
  items: readonly HomepageItem[],
  filters: Discovery,
  locale: HomepageLocale,
) {
  const query = filters.query.trim().toLocaleLowerCase(locale);
  const filtered = items.filter(
    (item) =>
      matchesNeed(item, filters.need) &&
      matchesRhythm(item, filters.rhythm) &&
      matchesAge(item, filters.age) &&
      matchesGoal(item, filters.goal) &&
      (!filters.available || canPurchase(item)) &&
      (!filters.category || item.category_key === filters.category) &&
      (!query ||
        `${item.name} ${item.short_description || ""} ${item.category_title || ""}`
          .toLocaleLowerCase(locale)
          .includes(query)),
  );
  return filtered.sort((a, b) => {
    const aPrice =
      a.price_mode !== "quote_only" &&
      a.price_amount !== null &&
      Number.isFinite(a.price_amount)
        ? a.price_amount
        : null;
    const bPrice =
      b.price_mode !== "quote_only" &&
      b.price_amount !== null &&
      Number.isFinite(b.price_amount)
        ? b.price_amount
        : null;
    if (filters.sort !== "curated") {
      if (aPrice === null && bPrice !== null) return 1;
      if (aPrice !== null && bPrice === null) return -1;
      if (aPrice !== null && bPrice !== null && aPrice !== bPrice)
        return filters.sort === "price-low" ? aPrice - bPrice : bPrice - aPrice;
    }
    return (
      Number(b.featured) - Number(a.featured) ||
      a.name.localeCompare(b.name, locale)
    );
  });
}
export function safeIds(
  raw: string | null,
  allowed: ReadonlySet<string>,
  limit = 12,
): string[] {
  if (!raw || raw.length > 12000) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string => typeof id === "string" && allowed.has(id),
            ),
          ),
        ].slice(0, limit)
      : [];
  } catch {
    return [];
  }
}
export function safeHref(value: string | null | undefined, fallback: string) {
  if (!value || /[\u0000-\u0020\\]/.test(value) || value.startsWith("//"))
    return fallback;
  return value.startsWith("/") || /^https?:\/\//i.test(value)
    ? value
    : fallback;
}
export const detailHref = (locale: HomepageLocale, item: HomepageItem) =>
  `/angelcare-marketplace/${locale}/marketplace/item/${encodeURIComponent(item.slug)}`;
/** The native delivery handler ignores fileName and serves the original when variant is absent. */
export function offerMediaUrl(media: string | null): string | null {
  if (!media || !media.startsWith("/api/angelcare-marketplace/media/"))
    return media;
  try {
    const url = new URL(media, "https://local.invalid");
    if (
      !/^\/api\/angelcare-marketplace\/media\/[a-f0-9-]+\/[^/]+$/i.test(
        url.pathname,
      )
    )
      return media;
    url.searchParams.delete("variant");
    return url.pathname + url.search + url.hash;
  } catch {
    return media;
  }
}
export function collectionHref(
  locale: HomepageLocale,
  id: string,
  items: readonly HomepageItem[],
) {
  return items.length
    ? `${detailHref(locale, items[0])}?collection=${encodeURIComponent(id)}`
    : `/angelcare-marketplace/${locale}/marketplace`;
}

/** Display ordering only: expose different declared atomic formats before repeating one. */
export function showcaseItems(items: readonly HomepageItem[]): HomepageItem[] {
  const groups = new Map<string, HomepageItem[]>();
  for (const item of items) {
    const key = schema(item) || item.kind;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  const ordered: HomepageItem[] = [];
  const buckets = [...groups.values()];
  for (let index = 0; ordered.length < items.length; index++) {
    for (const bucket of buckets) {
      if (bucket[index]) ordered.push(bucket[index]);
    }
  }
  return ordered;
}
