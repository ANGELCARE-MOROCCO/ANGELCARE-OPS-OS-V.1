import type {
  DiscoveryItem,
  StorefrontKey,
  StorefrontExperience,
} from "../catalog-discovery/types";

/** Merchandising destinations, never atomic categories or operational identities. */
export const STOREFRONTS = [
  {
    key: "families",
    label: "Familles",
    detail: "Le quotidien et les projets des familles",
    group: "Particuliers",
  },
  {
    key: "home-services",
    label: "Services à domicile",
    detail: "Relais et accompagnements à domicile",
    group: "Particuliers",
  },
  {
    key: "development",
    label: "Éveil & développement",
    detail: "Apprentissage, activités et découverte",
    group: "Particuliers",
  },
  {
    key: "kits",
    label: "Kits & produits",
    detail: "Équipements et ressources à découvrir",
    group: "Particuliers",
  },
  {
    key: "academy",
    label: "Academy",
    detail: "Formations et parcours de progression",
    group: "Formation",
  },
  {
    key: "establishments",
    label: "Établissements",
    detail: "Trois explorateurs, une sélection libre",
    group: "Organisations",
  },
  {
    key: "hospitality",
    label: "Hospitality",
    detail: "Hôtels et expériences d’accueil",
    group: "Organisations",
  },
  {
    key: "health-partners",
    label: "Partenaires santé",
    detail: "Solutions pour les structures de santé",
    group: "Organisations",
  },
  {
    key: "corporates",
    label: "Entreprises",
    detail: "Solutions et avantages aux collaborateurs",
    group: "Organisations",
  },
  {
    key: "partner-os",
    label: "Partner OS",
    detail: "La vitrine autonome des solutions Partner OS",
    group: "Plateformes",
  },
  {
    key: "quality-check",
    label: "Quality Check 360",
    detail: "Qualité, diagnostics et évaluations",
    group: "Plateformes",
  },
  {
    key: "professionals",
    label: "Professionnels",
    detail: "Solutions et parcours professionnels",
    group: "Formation",
  },
] as const satisfies readonly {
  key: StorefrontKey;
  label: string;
  detail: string;
  group: string;
}[];
export const ESTABLISHMENT_VIEWS = [
  { key: "conseil", label: "Conseil & programmes" },
  { key: "partner-os", label: "Partner OS · Établissements" },
  { key: "produits", label: "Produits & équipements" },
] as const;
export type EstablishmentView = (typeof ESTABLISHMENT_VIEWS)[number]["key"];
export type StorefrontPlacement = {
  version: 1;
  mode: "automatic" | "manual";
  storefronts: StorefrontKey[];
  establishmentViews: EstablishmentView[];
};
export const automaticPlacement = (): StorefrontPlacement => ({
  version: 1,
  mode: "automatic",
  storefronts: [],
  establishmentViews: [],
});
export const placementObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
export function normalizePlacement(value: unknown): StorefrontPlacement {
  const source = placementObject(value);
  if (source.mode !== "manual") return automaticPlacement();
  const storefronts = STOREFRONTS.filter(
    (row) =>
      Array.isArray(source.storefronts) && source.storefronts.includes(row.key),
  ).map((row) => row.key);
  const establishmentViews = storefronts.includes("establishments")
    ? ESTABLISHMENT_VIEWS.filter(
        (row) =>
          Array.isArray(source.establishmentViews) &&
          source.establishmentViews.includes(row.key),
      ).map((row) => row.key)
    : [];
  return { version: 1, mode: "manual", storefronts, establishmentViews };
}
export function validatePlacement(value: unknown): string[] {
  const source = placementObject(value),
    errors: string[] = [];
  if (source.version !== 1)
    errors.push("Version de placement non prise en charge.");
  if (!["automatic", "manual"].includes(String(source.mode)))
    errors.push("Choisissez le mode automatique ou manuel.");
  for (const [key, allowed] of [
    ["storefronts", STOREFRONTS.map((row) => row.key)],
    ["establishmentViews", ESTABLISHMENT_VIEWS.map((row) => row.key)],
  ] as const) {
    const values = source[key];
    if (
      !Array.isArray(values) ||
      values.some(
        (value) =>
          typeof value !== "string" ||
          !(allowed as readonly string[]).includes(value),
      )
    )
      errors.push("Destination inconnue dans " + key + ".");
  }
  if (
    source.mode === "manual" &&
    Array.isArray(source.storefronts) &&
    source.storefronts.includes("establishments") &&
    (!Array.isArray(source.establishmentViews) ||
      !source.establishmentViews.length)
  )
    errors.push(
      "Sélectionnez au moins un explorateur Établissements, ou retirez cette vitrine.",
    );
  if (
    Array.isArray(source.establishmentViews) &&
    source.establishmentViews.length &&
    (!Array.isArray(source.storefronts) ||
      !source.storefronts.includes("establishments"))
  )
    errors.push("Les explorateurs nécessitent la vitrine Établissements.");
  return errors;
}
export function itemPlacement(item: DiscoveryItem): StorefrontPlacement {
  return normalizePlacement(item.metadata.storefront_placement);
}
/** undefined means use the existing native decision, including all its original safeguards. */
export function manualMembership(
  item: DiscoveryItem,
  key: StorefrontKey,
): boolean | undefined {
  const config = itemPlacement(item);
  return config.mode === "manual"
    ? config.storefronts.includes(key)
    : undefined;
}
export function automaticEstablishmentView(
  item: DiscoveryItem,
): EstablishmentView {
  if (
    item.metadata.experience_schema_key === "partner-os-plan" ||
    item.kind === "saas_module"
  )
    return "partner-os";
  return item.kind === "product" || item.kind === "kit"
    ? "produits"
    : "conseil";
}
export function belongsToEstablishmentView(
  item: DiscoveryItem,
  view: EstablishmentView,
): boolean {
  const config = itemPlacement(item);
  return config.mode === "manual"
    ? config.storefronts.includes("establishments") &&
        config.establishmentViews.includes(view)
    : automaticEstablishmentView(item) === view;
}
export function placementFacets(
  items: readonly DiscoveryItem[],
): StorefrontExperience["facets"] {
  const facets: StorefrontExperience["facets"] = {};
  for (const [facet, key] of [
    ["kind", "kind"],
    ["availability", "availability_status"],
    ["category", "category_key"],
  ] as const) {
    const counts = new Map<string, number>();
    for (const item of items) {
      const value = item[key];
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    }
    facets[facet] = [...counts].map(([value, count]) => ({ value, count }));
  }
  return facets;
}
export function mergePlacedItems(
  automatic: readonly DiscoveryItem[],
  selected: readonly DiscoveryItem[],
  placements: ReadonlyMap<string, StorefrontPlacement>,
  key: StorefrontKey,
): DiscoveryItem[] {
  const result = new Map<string, DiscoveryItem>(),
    validated = new Set(selected.map((item) => item.id));
  for (const item of [...automatic, ...selected]) {
    const config = placements.get(item.id) || itemPlacement(item);
    if (
      config.mode === "manual" &&
      (!config.storefronts.includes(key) || !validated.has(item.id))
    )
      continue;
    if (!item.id || !item.slug) continue;
    result.set(item.id, {
      ...item,
      metadata: { ...item.metadata, storefront_placement: config },
    });
  }
  return [...result.values()];
}
export type PlacementSnapshot = {
  itemId: string;
  name: string;
  slug: string;
  status: string;
  territoryCode: string | null;
  updatedAt: string;
  canManage: boolean;
  config: StorefrontPlacement;
  publicIssues: Array<{
    code: string;
    message: string;
    section: "publication" | "categories" | "availability" | "territories";
  }>;
};
