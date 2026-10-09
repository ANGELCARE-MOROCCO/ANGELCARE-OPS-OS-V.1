// families-gateway-r2/verification/installer-fixture/apps/marketplace-web/angelcare-marketplace/homepage-living-marketplace/immersive/contract.ts
var INITIAL_DISCOVERY = {
  need: "all",
  rhythm: "all",
  age: "all",
  goal: "all",
  query: "",
  category: "",
  available: false,
  sort: "curated"
};
var HOME_MODULES = [
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
  "finale"
];
var record = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
var configuration = (item) => ({
  ...record(item.metadata.experience_configuration),
  ...record(item.experience_configuration)
});
function canonicalItems(experience) {
  const source = experience.catalogItems ?? [
    experience.featuredItems,
    experience.availableItems,
    experience.popularItems,
    experience.bestPickItems,
    experience.newArrivalItems,
    experience.familyItems,
    experience.developmentItems,
    experience.academyItems,
    experience.organizationItems
  ].flat();
  const map = /* @__PURE__ */ new Map();
  for (const item of source)
    if (item.id && item.slug && !map.has(item.id)) map.set(item.id, item);
  return [...map.values()];
}
function canonicalSubset(source, canonical) {
  const byId = new Map(canonical.map((item) => [item.id, item]));
  return [...new Set(source.map((item) => item.id))].flatMap(
    (id) => byId.has(id) ? [byId.get(id)] : []
  );
}
function canonicalCollections(experience, items) {
  return experience.collections.map((collection) => ({
    ...collection,
    items: canonicalSubset(collection.items, items)
  })).filter((collection) => collection.items.length > 0);
}
function schema(item) {
  const explicit = item.experience_schema_key || item.metadata.experience_schema_key;
  if (typeof explicit === "string" && explicit) return explicit;
  if (item.metadata.family_storefront_assignment !== true || item.kind !== "service")
    return "";
  const type = item.metadata.family_sellable_type;
  if (!["one_time_service", "recurring_service"].includes(String(type)))
    return "";
  switch (item.metadata.family_service_capability) {
    case "advanced-childcare":
      return type === "recurring_service" ? "home-childcare-recurring" : "home-childcare-one-time";
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
var CARE = [
  "home-childcare-one-time",
  "home-childcare-recurring",
  "school-pickup-care",
  "overnight-extended-care",
  "emergency-last-minute-care",
  "hotel-travel-childcare"
];
var LEARN = [
  "montessori-home-service",
  "learning-homework-support",
  "home-activities",
  "flashcards-learning-product",
  "development-game",
  "digital-learning-resource",
  "montessori-development-kit"
];
var PROFESSIONAL_SCHEMAS = [
  "school-managed-programme",
  "school-staff-reinforcement",
  "hospitality-kids-programme",
  "corporate-childcare-benefit",
  "health-adjacent-programme",
  "event-venue-programme",
  "partner-os-plan",
  "quality-check-assessment",
  "custom-managed-solution"
];
function matchesNeed(item, need) {
  if (need === "all") return true;
  const key = schema(item);
  if (need === "care") return item.kind === "service" && CARE.includes(key);
  if (need === "baby") return item.kind === "service" && key === "postpartum";
  if (need === "learn")
    return ["product", "kit", "service"].includes(item.kind) && LEARN.includes(key);
  if (need === "play") return item.kind === "product" || item.kind === "kit";
  return item.kind === "audit" || item.kind === "saas_module" || PROFESSIONAL_SCHEMAS.includes(key) || item.metadata.audience === "organization" || [
    "establishments",
    "institutions",
    "hospitality",
    "health-partners",
    "corporates",
    "corporate",
    "partner-os",
    "quality-check",
    "quality",
    "professionals"
  ].includes(item.category_key || "");
}
function developmentPool(experience, items) {
  const explicit = items.filter(
    (item) => matchesNeed(item, "learn") || ["development", "kits"].includes(item.category_key || "")
  );
  return canonicalSubset([...experience.developmentItems, ...explicit], items);
}
function professionalPool(experience, items) {
  return canonicalSubset(
    [
      ...experience.organizationItems,
      ...items.filter((item) => matchesNeed(item, "professional"))
    ],
    items
  );
}
function matchesRhythm(item, rhythm) {
  if (rhythm === "all") return true;
  return item.kind === "service" && schema(item) === {
    once: "home-childcare-one-time",
    recurring: "home-childcare-recurring",
    night: "overnight-extended-care",
    pickup: "school-pickup-care"
  }[rhythm];
}
function ageRanges(item) {
  const c = configuration(item), detail = record(item.metadata.family_card_details), v = { ...c, ...detail };
  const number = (value) => typeof value === "number" && Number.isFinite(value) ? value : typeof value === "string" && /^\d+(\.\d+)?$/.test(value) ? Number(value) : null;
  const min = number(v.age_min), max = number(v.age_max);
  if (min !== null && max !== null && min >= 0 && max >= min && max <= 18 && !/month|mois|شهر/.test(String(v.age_unit || "")))
    return [[min, max]];
  const source = v.child_age_bands ?? v.age_range ?? v.age_bands;
  const values = Array.isArray(source) ? source : typeof source === "string" ? source.split(/[|,;]/) : [];
  return values.flatMap((value) => {
    if (typeof value !== "string") return [];
    const match = value.trim().match(
      /^(?:ages?\s*)?(\d{1,2})\s*(?:-|–|—|to|à|إلى)\s*(\d{1,2})(?:\s*(?:ans?|years?|سنوات|سنة))?$/i
    );
    if (!match) return [];
    const a = Number(match[1]), b = Number(match[2]);
    return a <= b && b <= 18 ? [[a, b]] : [];
  });
}
function matchesAge(item, age) {
  if (age === "all") return true;
  const [min, max] = age.split("-").map(Number);
  return ageRanges(item).some(([a, b]) => a <= max && b >= min);
}
var strings = (value) => (Array.isArray(value) ? value.filter((v) => typeof v === "string") : typeof value === "string" ? value.split(/[|,;]/) : []).map((value2) => value2.trim()).filter(Boolean);
var GOALS = {
  language: [
    "language",
    "language_development",
    "langage",
    "communication",
    "\u0644\u063A\u0629",
    "\u0627\u0644\u0644\u063A\u0629"
  ],
  autonomy: [
    "autonomy",
    "autonomie",
    "independence",
    "practical_life",
    "vie pratique",
    "\u0627\u0644\u0627\u0633\u062A\u0642\u0644\u0627\u0644\u064A\u0629"
  ],
  creativity: ["creativity", "cr\xE9ativit\xE9", "creative", "art", "\u0627\u0644\u0625\u0628\u062F\u0627\u0639"],
  concentration: ["concentration", "attention", "focus", "\u0627\u0644\u062A\u0631\u0643\u064A\u0632"]
};
function matchesGoal(item, goal) {
  if (goal === "all") return true;
  const c = configuration(item);
  return [
    c.competency_areas,
    c.competency_domains,
    c.learning_domains,
    c.developmental_areas,
    c.learning_objectives
  ].flatMap(strings).some((value) => GOALS[goal].includes(value.toLocaleLowerCase()));
}
var canPurchase = (item) => ["available", "limited"].includes(item.availability_status);
function discover(items, filters, locale) {
  const query = filters.query.trim().toLocaleLowerCase(locale);
  const filtered = items.filter(
    (item) => matchesNeed(item, filters.need) && matchesRhythm(item, filters.rhythm) && matchesAge(item, filters.age) && matchesGoal(item, filters.goal) && (!filters.available || canPurchase(item)) && (!filters.category || item.category_key === filters.category) && (!query || `${item.name} ${item.short_description || ""} ${item.category_title || ""}`.toLocaleLowerCase(locale).includes(query))
  );
  return filtered.sort((a, b) => {
    const aPrice = a.price_mode !== "quote_only" && a.price_amount !== null && Number.isFinite(a.price_amount) ? a.price_amount : null;
    const bPrice = b.price_mode !== "quote_only" && b.price_amount !== null && Number.isFinite(b.price_amount) ? b.price_amount : null;
    if (filters.sort !== "curated") {
      if (aPrice === null && bPrice !== null) return 1;
      if (aPrice !== null && bPrice === null) return -1;
      if (aPrice !== null && bPrice !== null && aPrice !== bPrice)
        return filters.sort === "price-low" ? aPrice - bPrice : bPrice - aPrice;
    }
    return Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name, locale);
  });
}
function safeIds(raw, allowed, limit = 12) {
  if (!raw || raw.length > 12e3) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? [
      ...new Set(
        value.filter(
          (id) => typeof id === "string" && allowed.has(id)
        )
      )
    ].slice(0, limit) : [];
  } catch {
    return [];
  }
}
function safeHref(value, fallback) {
  if (!value || /[\u0000-\u0020\\]/.test(value) || value.startsWith("//"))
    return fallback;
  return value.startsWith("/") || /^https?:\/\//i.test(value) ? value : fallback;
}
var detailHref = (locale, item) => `/angelcare-marketplace/${locale}/marketplace/item/${encodeURIComponent(item.slug)}`;
function offerMediaUrl(media) {
  if (!media || !media.startsWith("/api/angelcare-marketplace/media/"))
    return media;
  try {
    const url = new URL(media, "https://local.invalid");
    if (!/^\/api\/angelcare-marketplace\/media\/[a-f0-9-]+\/[^/]+$/i.test(
      url.pathname
    ))
      return media;
    url.searchParams.delete("variant");
    return url.pathname + url.search + url.hash;
  } catch {
    return media;
  }
}
function collectionHref(locale, id, items) {
  return items.length ? `${detailHref(locale, items[0])}?collection=${encodeURIComponent(id)}` : `/angelcare-marketplace/${locale}/marketplace`;
}
function showcaseItems(items) {
  const groups = /* @__PURE__ */ new Map();
  for (const item of items) {
    const key = schema(item) || item.kind;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  const ordered = [];
  const buckets = [...groups.values()];
  for (let index = 0; ordered.length < items.length; index++) {
    for (const bucket of buckets) {
      if (bucket[index]) ordered.push(bucket[index]);
    }
  }
  return ordered;
}
export {
  HOME_MODULES,
  INITIAL_DISCOVERY,
  ageRanges,
  canPurchase,
  canonicalCollections,
  canonicalItems,
  canonicalSubset,
  collectionHref,
  configuration,
  detailHref,
  developmentPool,
  discover,
  matchesAge,
  matchesGoal,
  matchesNeed,
  matchesRhythm,
  offerMediaUrl,
  professionalPool,
  safeHref,
  safeIds,
  schema,
  showcaseItems,
  strings
};
