import type { DiscoveryItem } from "../catalog-discovery/types";
import {
  FAMILIES,
  FORMULAS,
  MODULES,
  PRODUCT_CHAPTERS,
  type View,
} from "./content";
import { channel, searchText } from "./model";
export type JourneyResult = {
  key: string;
  title: string;
  text: string;
  label: string;
  view: View;
  type: "formula" | "module" | "universe" | "offer" | "invitation";
  target: string;
};
export function journeyIndex(offers: DiscoveryItem[]): JourneyResult[] {
  return [
    {
      key: "invitation:partner-free-year",
      title: "Partner OS · 1 an gratuit",
      text: "12 mois complets sur le plan gratuit. Découvrez le périmètre et préparez votre demande de mise en route.",
      label: "Offre de bienvenue · conditions du plan à confirmer",
      view: "partner-os",
      type: "invitation",
      target: "partner-free-year",
    },
    ...FORMULAS.map((f) => ({
      key: `formula:${f.id}`,
      title: f.name,
      text: f.facts.join(" · "),
      label: FAMILIES.find((x) => x.key === f.family)!.purpose,
      view: "conseil" as const,
      type: "formula" as const,
      target: f.id,
    })),
    ...MODULES.map((m) => ({
      key: `module:${m.id}`,
      title: m.title,
      text: m.text,
      label: `Partner OS · ${m.group}`,
      view: "partner-os" as const,
      type: "module" as const,
      target: m.id,
    })),
    ...PRODUCT_CHAPTERS.flatMap((c, i) =>
      c.universes.map((u, j) => ({
        key: `universe:${i}:${j}`,
        title: u.title,
        text: u.text,
        label: `Univers ${String(i * 4 + j + 1).padStart(2, "0")} · Produits`,
        view: "produits" as const,
        type: "universe" as const,
        target: `ew-chapter-${i + 1}`,
      })),
    ),
    ...offers.map((o) => ({
      key: `offer:${o.id}`,
      title: o.name,
      text: `${o.public_reference} ${o.short_description || ""}`,
      label: o.category_title || "Offre publiée",
      view: channel(o),
      type: "offer" as const,
      target: o.id,
    })),
  ];
}
export function findJourney(
  index: JourneyResult[],
  query: string,
  view: View | "all",
) {
  const terms = searchText(query.slice(0, 160))
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return index.filter(
    (r) =>
      (view === "all" || r.view === view) &&
      terms.every((term) =>
        searchText(`${r.title} ${r.text} ${r.label}`).includes(term),
      ),
  );
}
