import type { CatalogLocale } from "../catalog-discovery/types";
import type {
  DevelopmentActivity,
  DevelopmentCategory,
  DevelopmentKit,
} from "../development-engine/types";
import type { AcademyProgram } from "../academy-engine/types";
import type { PartnerPlan } from "../partner-os/types";
import type { PublishedSurfaceExperience } from "../total-commerce-control/types";
import { baseHref, safeHref, text } from "./contract";
import { C, tr } from "./content";

export interface PublicResource {
  id: string;
  title: string;
  body: string;
  facts: string[];
  href: string;
  kind: "activity" | "development-kit" | "programme" | "plan";
  sourceLocale: "fr";
  amount?: number | null;
  currency?: string;
  period?: PartnerPlan["billing_period"];
  modules?: number;
}
export interface PublicEditorial {
  id: string;
  title: string;
  body: string;
  eyebrow: string;
  media: string | null;
  href: string | null;
  label: string | null;
  layout: string;
}
export interface NativeContext {
  resources: PublicResource[];
  editorial: PublicEditorial[];
  copy: PublishedSurfaceExperience["copy"];
  statistics?: { activePrograms: number; organizations: number };
}
export const emptyNative = (): NativeContext => ({
  resources: [],
  editorial: [],
  copy: {},
});
export function surfaceContext(
  surface: PublishedSurfaceExperience | null | undefined,
): NativeContext {
  if (!surface) return emptyNative();
  const copy: NativeContext["copy"] = {};
  for (const key of [
    "eyebrow",
    "title",
    "lead",
    "primary_cta_label",
    "primary_cta_href",
    "secondary_cta_label",
    "secondary_cta_href",
    "media_url",
  ]) {
    const value = text(surface.copy[key]);
    if (value) copy[key] = value;
  }
  return {
    resources: [],
    copy,
    editorial: [
      ...surface.cards.map((card, index) => ({
        id: `card-${index}`,
        title: card.title,
        body: card.body || "",
        eyebrow: card.badge || "",
        media: card.media_url || null,
        href: card.href ? safeHref(card.href, "") || null : null,
        label: null,
        layout: "card",
      })),
      ...surface.sections
        .filter((section) => section.visible && section.status === "published")
        .map((section) => ({
          id: section.id,
          title: section.title || "",
          body: section.body || "",
          eyebrow: section.eyebrow || "",
          media: section.media_url || null,
          href: section.primary_cta_href
            ? safeHref(section.primary_cta_href, "") || null
            : null,
          label: section.primary_cta_label || null,
          layout: section.layout_variant,
        })),
    ],
  };
}
export function developmentContext(
  locale: CatalogLocale,
  categories: DevelopmentCategory[],
  activities: DevelopmentActivity[],
  kits: DevelopmentKit[],
  surface?: PublishedSurfaceExperience | null,
): NativeContext {
  const native = surfaceContext(surface),
    cat = new Map(
      categories
        .filter((c) => c.status === "published")
        .map((c) => [c.id, c.name_fr]),
    );
  native.resources = [
    ...activities
      .filter((a) => a.status === "published")
      .map((a) => ({
        id: a.id,
        title: a.title_fr,
        body: a.objective_fr,
        facts: [
          cat.get(a.category_id || "") || "",
          a.age_min_months !== null && a.age_max_months !== null
            ? `${a.age_min_months}–${a.age_max_months} ${tr(C.months, locale)}`
            : "",
          a.duration_minutes !== null
            ? `${a.duration_minutes} ${tr(C.minutes, locale)}`
            : "",
          ...a.materials,
        ].filter(Boolean),
        href: `${baseHref(locale)}/family/request`,
        kind: "activity" as const,
        sourceLocale: "fr" as const,
      })),
    ...kits
      .filter((k) => k.status === "published")
      .map((k) => ({
        id: k.id,
        title: k.name_fr,
        body: k.description_fr || "",
        facts: [
          k.age_min_months !== null && k.age_max_months !== null
            ? `${k.age_min_months}–${k.age_max_months} ${tr(C.months, locale)}`
            : "",
        ].filter(Boolean),
        href: `${baseHref(locale)}/kits`,
        kind: "development-kit" as const,
        sourceLocale: "fr" as const,
      })),
  ];
  return native;
}
export function academyContext(
  locale: CatalogLocale,
  programmes: AcademyProgram[],
  surface?: PublishedSurfaceExperience | null,
): NativeContext {
  const native = surfaceContext(surface);
  native.resources = programmes
    .filter((p) => p.status === "published")
    .map((p) => ({
      id: p.id,
      title: p.title_fr,
      body: p.description_fr || "",
      facts: p.target_audience,
      href: `${baseHref(locale)}/academy/request`,
      kind: "programme",
      sourceLocale: "fr",
    }));
  return native;
}
export function partnerContext(
  locale: CatalogLocale,
  plans: PartnerPlan[],
): NativeContext {
  return {
    ...emptyNative(),
    resources: plans
      .filter((p) => p.status === "published")
      .map((p) => ({
        id: p.id,
        title: p.name_fr,
        body: p.description_fr || "",
        facts: [],
        href: `${baseHref(locale)}/partner-os/contact`,
        kind: "plan",
        sourceLocale: "fr",
        amount: p.base_price,
        currency: p.currency_label,
        period: p.billing_period,
        modules: p.module_count,
      })),
  };
}
