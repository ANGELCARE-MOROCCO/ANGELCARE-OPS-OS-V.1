import type { DiscoveryItem } from "../catalog-discovery/types";
import { unavailable } from "../storefront-immersive/contract";
import { projection } from "../business-worlds/merchandising";
import { MODULES, FORMULAS, type Formula, type View } from "./content";
export function viewFromHash(hash: string): View {
  const key = hash.replace(/^#/, "").split("/")[0];
  return key === "partner-os" || key === "produits" ? key : "conseil";
}
export function schema(item: DiscoveryItem): string {
  return String(item.metadata.experience_schema_key || "");
}
export function channel(item: DiscoveryItem): View {
  if (schema(item) === "partner-os-plan" || item.kind === "saas_module")
    return "partner-os";
  if (item.kind === "product" || item.kind === "kit") return "produits";
  return "conseil";
}
export function blocked(item: DiscoveryItem): boolean {
  return (
    unavailable(item) ||
    ["hidden", "territory_restricted", "cancelled", "suspended"].includes(
      item.availability_status,
    )
  );
}
export const searchText = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
export function filterOffers(
  items: DiscoveryItem[],
  options: {
    view: View | "all";
    query: string;
    category: string;
    availability: string;
    sort: string;
    priceMode?: string;
    savedOnly?: boolean;
    savedIds?: readonly string[];
    factKey?: string;
    factValue?: string;
  },
): DiscoveryItem[] {
  const query = searchText(options.query);
  const result = items.filter(
    (item) =>
      (options.view === "all" || channel(item) === options.view) &&
      (!options.priceMode ||
        options.priceMode === "all" ||
        item.price_mode === options.priceMode) &&
      (!options.savedOnly || options.savedIds?.includes(item.id)) &&
      (!options.factKey ||
        !options.factValue ||
        projection(item)?.fields.some(
          (fact) =>
            fact.key === options.factKey &&
            fact.values.includes(options.factValue!),
        )) &&
      (options.category === "all" || item.category_key === options.category) &&
      (options.availability === "all" ||
        item.availability_status === options.availability) &&
      (!query ||
        searchText(
          `${item.name} ${item.public_reference} ${item.item_key} ${item.short_description || ""}`,
        ).includes(query)),
  );
  return result.sort((a, b) => {
    if (options.sort === "price")
      return (
        (a.price_mode === "quote_only"
          ? Infinity
          : (a.price_amount ?? Infinity)) -
          (b.price_mode === "quote_only"
            ? Infinity
            : (b.price_amount ?? Infinity)) || a.id.localeCompare(b.id)
      );
    if (options.sort === "name")
      return a.name.localeCompare(b.name, "fr") || a.id.localeCompare(b.id);
    return (
      Number(b.featured) - Number(a.featured) ||
      a.name.localeCompare(b.name, "fr") ||
      a.id.localeCompare(b.id)
    );
  });
}
// A brochure formula never acquires a native catalogue identity through its display title.
export function linkedOffer(
  formula: Formula,
  offers: DiscoveryItem[],
): DiscoveryItem | undefined {
  return offers.find(
    (item) =>
      channel(item) === "conseil" &&
      [
        item.item_key,
        (
          item.metadata.experience_configuration as
            Record<string, unknown> | undefined
        )?.programme_key,
      ].some(
        (key) =>
          typeof key === "string" &&
          key.toLowerCase().replaceAll("_", "-") === formula.id,
      ),
  );
}
export interface Selection {
  key: string;
  title: string;
  detail: string;
  kind: "offer" | "formula" | "module" | "intent";
  id?: string;
}
export function toggleSelection(
  previous: Selection[],
  item: Selection,
  max = 8,
): Selection[] {
  return previous.some((value) => value.key === item.key)
    ? previous.filter((value) => value.key !== item.key)
    : previous.length < max
      ? [...previous, item]
      : previous;
}
export function requestBrief(
  view: View,
  selected: Selection[],
  territory?: string | null,
): string {
  return [
    `Établissements · ${view}`,
    territory ? `Territoire choisi : ${territory}` : "",
    ...selected.map(
      (item) =>
        `${item.kind === "offer" ? `Offre publiée [${item.id}]` : item.kind === "formula" ? "Formule de référence brochure" : item.kind === "module" ? "Capacité présentée" : "Demande commerciale"} : ${item.title} — ${item.detail}`,
    ),
  ]
    .filter(Boolean)
    .join("\n");
}
export function price(item: DiscoveryItem): string {
  if (item.price_mode === "quote_only" || item.price_amount === null)
    return "Sur devis";
  return `${item.price_mode === "starting_from" ? "Dès " : ""}${new Intl.NumberFormat("fr-FR").format(item.price_amount)} ${item.currency_label}${item.price_mode === "subscription" ? " · abonnement" : ""}`;
}
export function selectedReferences(keys: string[]): Formula[] {
  return FORMULAS.filter((value) => keys.includes(value.id));
}

export const formulaSelection = (formula: Formula): Selection => ({
  key: `formula:${formula.id}`,
  kind: "formula",
  title: formula.name,
  detail: `${formula.frequency} · ${formula.reporting} · tarif brochure ${new Intl.NumberFormat("fr-FR").format(formula.amount)} MAD / ${formula.unit}, périmètre à confirmer`,
});
export const offerSelection = (item: DiscoveryItem): Selection => ({
  key: `offer:${item.id}`,
  kind: "offer",
  id: item.id,
  title: item.name,
  detail: `${price(item)} · ${item.public_reference}`,
});
export const freeYearSelection = (): Selection => ({
  key: "intent:partner-free-year",
  kind: "intent",
  title: "Partner OS · plan gratuit pendant 12 mois",
  detail:
    "Demande de l’offre commerciale : confirmer le périmètre, les conditions et l’activation du plan gratuit. Aucun module payant n’est demandé automatiquement.",
});

/** Store keys only. Restored native IDs and all text are rebuilt from today's eligible catalogue. */
export function restoreProject(
  raw: string | null,
  offers: DiscoveryItem[],
): Selection[] {
  if (!raw || raw.length > 12000) return [];
  try {
    const keys: unknown = JSON.parse(raw);
    if (!Array.isArray(keys)) return [];
    return [
      ...new Set(keys.filter((key): key is string => typeof key === "string")),
    ]
      .flatMap((key) => {
        if (key.startsWith("offer:")) {
          const item = offers.find(
            (item) => `offer:${item.id}` === key && !blocked(item),
          );
          return item ? [offerSelection(item)] : [];
        }
        if (key.startsWith("formula:")) {
          const formula = FORMULAS.find((item) => `formula:${item.id}` === key);
          return formula ? [formulaSelection(formula)] : [];
        }
        if (key.startsWith("module:")) {
          const module = MODULES.find((item) => `module:${item.id}` === key);
          return module
            ? [
                {
                  key,
                  kind: "module" as const,
                  title: module.title,
                  detail: module.text,
                },
              ]
            : [];
        }
        return key === "intent:partner-free-year" ? [freeYearSelection()] : [];
      })
      .slice(0, 8);
  } catch {
    return [];
  }
}
export type ProjectState = { items: Selection[]; notice: string };
export type ProjectAction =
  | { type: "dismiss" }
  | { type: "toggle"; item: Selection }
  | { type: "free" }
  | { type: "remove"; key: string }
  | { type: "restore"; items: Selection[] };
export function projectReducer(
  state: ProjectState,
  action: ProjectAction,
): ProjectState {
  if (action.type === "dismiss") return { ...state, notice: "" };
  if (action.type === "restore") return { items: action.items, notice: "" };
  if (action.type === "remove")
    return {
      items: state.items.filter((item) => item.key !== action.key),
      notice: "Élément retiré du projet.",
    };
  const item = action.type === "free" ? freeYearSelection() : action.item;
  const exists = state.items.some((value) => value.key === item.key);
  if (action.type === "free" && exists)
    return {
      ...state,
      notice:
        "Votre demande pour les 12 mois gratuits figure déjà dans le projet.",
    };
  if (!exists && state.items.length >= 8)
    return {
      ...state,
      notice:
        "Votre projet contient huit éléments. Retirez un élément avant d’ajouter cette demande.",
    };
  return {
    items: toggleSelection(state.items, item),
    notice: exists
      ? "Élément retiré du projet."
      : `${item.title} ajouté à votre projet.`,
  };
}

export type OfferFilters = {
  scope: "speciality" | "all";
  query: string;
  category: string;
  availability: string;
  sort: string;
  priceMode: string;
  savedOnly: boolean;
  factKey: string;
  factValue: string;
  page: number;
};
export const DEFAULT_FILTERS: OfferFilters = {
  scope: "speciality",
  query: "",
  category: "all",
  availability: "all",
  sort: "featured",
  priceMode: "all",
  savedOnly: false,
  factKey: "",
  factValue: "",
  page: 1,
};
export function decodeFilters(value: unknown): OfferFilters {
  const v =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const text = (key: string, max = 160) =>
    typeof v[key] === "string" ? (v[key] as string).slice(0, max) : "";
  return {
    scope: v.scope === "all" ? "all" : "speciality",
    query: text("query"),
    category: text("category") || "all",
    availability: text("availability") || "all",
    sort: ["featured", "name", "price"].includes(text("sort"))
      ? text("sort")
      : "featured",
    priceMode: [
      "all",
      "quote_only",
      "fixed",
      "starting_from",
      "subscription",
    ].includes(text("priceMode"))
      ? text("priceMode")
      : "all",
    savedOnly: v.savedOnly === true,
    factKey: text("factKey"),
    factValue: text("factValue", 500),
    page:
      typeof v.page === "number" && Number.isInteger(v.page)
        ? Math.max(1, Math.min(10000, v.page))
        : 1,
  };
}
export function publicFacets(items: DiscoveryItem[]) {
  const fields = new Map<
    string,
    { key: string; label: string; values: string[] }
  >();
  for (const item of items)
    for (const fact of projection(item)?.fields || []) {
      const existing = fields.get(fact.key) || {
        key: fact.key,
        label: fact.label,
        values: [],
      };
      existing.values = [
        ...new Set([
          ...existing.values,
          ...fact.values.filter(
            (value) => typeof value === "string" && value.length <= 500,
          ),
        ]),
      ].sort((a, b) => a.localeCompare(b, "fr"));
      if (existing.values.length) fields.set(fact.key, existing);
    }
  return [...fields.values()];
}
export function enquiryMessage(message: string, brief: string): string {
  return [message.trim(), brief.trim()].filter(Boolean).join("\n\n");
}
