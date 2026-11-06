"use client";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  GitCompareArrows,
  Heart,
  Layers3,
  ListFilter,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import type { DiscoveryItem } from "../catalog-discovery/types";
import { Photo } from "../storefront-immersive/ExperienceUI";
import {
  availabilityLabel,
  priceLabel,
  unavailable,
} from "../storefront-immersive/contract";
import { useWorld } from "./Shared";
import {
  COMMERCIAL_PROFILES,
  M,
  businessItemHref,
  contextualItems,
  localized,
  nativeAction,
  projection,
  schemaOf,
  segmentItems,
  uniqueItems,
} from "./merchandising";
import c from "./commerce.module.css";

const PLAN_PERIODS = {
  monthly: { fr: "mois", en: "month", ar: "شهر" },
  quarterly: { fr: "trimestre", en: "quarter", ar: "فصل" },
  annual: { fr: "an", en: "year", ar: "سنة" },
  custom: { fr: "période définie", en: "defined period", ar: "فترة محددة" },
};
function useCopy() {
  const { locale } = useWorld();
  return (key: keyof typeof M) => localized(M[key], locale);
}
export function BusinessOfferCard({
  item,
  compact = false,
}: {
  item: DiscoveryItem;
  compact?: boolean;
}) {
  const { locale, world, experience, selections, project, toggleProject } =
      useWorld(),
    t = useCopy();
  const info = projection(item),
    profile = COMMERCIAL_PROFILES[world],
    action = nativeAction(item, locale, experience.territoryCode);
  const saved = selections.saved.includes(item.id),
    compared = selections.compared.includes(item.id),
    prepared = project.some((value) => value.id === item.id);
  const facts = info?.fields || [],
    ordered = [...facts].sort((a, b) => {
      const aIndex = profile.fields.indexOf(a.key),
        bIndex = profile.fields.indexOf(b.key);
      return (aIndex < 0 ? 100 : aIndex) - (bIndex < 0 ? 100 : bIndex);
    });
  const blocked =
    unavailable(item) ||
    ["hidden", "territory_restricted"].includes(item.availability_status);
  return (
    <article
      className={c.card}
      data-business-offer={item.id}
      data-compact={compact}
      data-available={!blocked}
    >
      <div className={c.cardHeading}>
        <span>{info?.schemaLabel || item.category_title || t("scope")}</span>
        {item.featured ? (
          <span className={c.featured}>
            <Sparkles size={12} />
            {t("recommended")}
          </span>
        ) : null}
      </div>
      <Link
        className={c.media}
        href={businessItemHref(item, locale, experience.territoryCode)}
        onClick={() => selections.remember(item.id)}
        aria-label={item.name}
      >
        <Photo src={item.media_url} alt={item.name} contain />
      </Link>
      <div className={c.cardBody}>
        <div className={c.badges}>
          <span data-status={item.availability_status}>
            {availabilityLabel(item, locale)}
          </span>
          {info?.lane === "related" ? <span>{t("related")}</span> : null}
          {info?.sourceLocale === "fr" && locale !== "fr" ? (
            <span lang="fr">{t("sourceFr")}</span>
          ) : null}
        </div>
        <h3>
          <Link
            href={businessItemHref(item, locale, experience.territoryCode)}
            onClick={() => selections.remember(item.id)}
          >
            {item.name}
          </Link>
        </h3>
        {item.short_description ? <p>{item.short_description}</p> : null}
        {ordered.length ? (
          <dl className={c.facts}>
            {ordered.slice(0, compact ? 2 : 4).map((fact) => (
              <div key={fact.key}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {!compact && ordered.length > 4 ? (
          <details className={c.specifications}>
            <summary>
              {t("moreFacts")}
              <ChevronDown size={14} />
            </summary>
            <dl className={c.facts}>
              {ordered.slice(4).map((fact) => (
                <div key={fact.key}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </details>
        ) : null}
        {item.trust_labels.length ? (
          <div className={c.badges}>
            {item.trust_labels.slice(0, 2).map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        ) : null}
        <div className={c.price}>
          <strong>{priceLabel(item, locale)}</strong>
          <Link href={businessItemHref(item, locale, experience.territoryCode)}>
            {t("details")}
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className={c.cardActions}>
          <button
            type="button"
            aria-label={`${t("saved")}: ${item.name}`}
            aria-pressed={saved}
            disabled={selections.pending.includes(`saved:${item.id}`)}
            onClick={() => void selections.select(item.id, "saved")}
          >
            <Heart size={17} fill={saved ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            aria-label={`${t("compare")}: ${item.name}`}
            aria-pressed={compared}
            disabled={selections.pending.includes(`compare:${item.id}`)}
            onClick={() => void selections.select(item.id, "compare")}
          >
            <GitCompareArrows size={17} />
          </button>
          <button
            type="button"
            className={c.prepare}
            aria-pressed={prepared}
            disabled={!prepared && project.length >= 8}
            title={
              !prepared && project.length >= 8
                ? locale === "fr"
                  ? "Huit offres maximum par projet. Retirez une offre pour en ajouter une autre."
                  : locale === "ar"
                    ? "ثمانية عروض كحد أقصى لكل مشروع."
                    : "Up to eight offers per brief. Remove an offer to add another."
                : undefined
            }
            onClick={() => toggleProject(item.id)}
          >
            {prepared ? <Check size={15} /> : <Layers3 size={15} />}
            {t(prepared ? "selected" : "prepare")}
          </button>
        </div>
        {!compact && action && !blocked ? (
          <Link
            className={c.nativeAction}
            href={action.href}
            onClick={() => selections.remember(item.id)}
          >
            {action.label}
            <ArrowUpRight size={16} />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function SelectionFeedback() {
  const { selections, locale } = useWorld();
  if (!selections.error) return null;
  return (
    <div className={c.feedback} role="alert">
      <span>
        {selections.error === "limit"
          ? locale === "fr"
            ? "Comparez jusqu’à quatre offres."
            : locale === "ar"
              ? "يمكن مقارنة أربعة عروض."
              : "Compare up to four offers."
          : locale === "fr"
            ? "La sélection n’a pas pu être confirmée. Réessayez."
            : locale === "ar"
              ? "تعذر تأكيد الاختيار. يرجى المحاولة مجدداً."
              : "Selection could not be confirmed. Please retry."}
      </span>
      <button
        type="button"
        onClick={selections.dismiss}
        aria-label={
          locale === "fr" ? "Fermer" : locale === "ar" ? "إغلاق" : "Dismiss"
        }
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function CommercialOpening() {
  const { experience, world, locale, native } = useWorld(),
    t = useCopy(),
    profile = COMMERCIAL_PROFILES[world];
  const [segment, setSegment] = useState("all");
  const items = experience.items,
    selected = profile.segments.find((value) => value.key === segment),
    visible = segmentItems(items, selected);
  const schemaCount = new Set(items.map(schemaOf).filter(Boolean)).size;
  return (
    <section
      id="world-discover"
      className={c.opening}
      data-business-commerce="early-selection"
    >
      <div className={c.openingHead}>
        <div>
          <span className={c.eyebrow}>
            <Sparkles size={14} />
            {localized(profile.audience, locale)}
          </span>
          <h2>{localized(profile.title, locale)}</h2>
          <p>{localized(profile.lead, locale)}</p>
        </div>
        <a className={c.outlineButton} href="#world-offers">
          {t("full")}
          <ArrowDown size={16} />
        </a>
      </div>
      <div className={c.signalStrip}>
        <span>
          <strong>{items.length}</strong>
          {t("live")}
        </span>
        <span>
          <strong>{schemaCount}</strong>
          {t("solution")}
        </span>
        {world === "partner-os" &&
        native.resources.some((resource) => resource.kind === "plan") ? (
          <span>
            <strong>
              {
                native.resources.filter((resource) => resource.kind === "plan")
                  .length
              }
            </strong>
            {t("nativePlans")}
          </span>
        ) : null}
        <a href="#world-enquiry">
          {t("next")}
          <ArrowUpRight size={15} />
        </a>
      </div>
      <div className={c.segments} role="group" aria-label={t("solution")}>
        <button
          type="button"
          aria-pressed={segment === "all"}
          onClick={() => setSegment("all")}
        >
          {t("all")}
          <b>{items.length}</b>
        </button>
        {profile.segments.map((value) => {
          const count = segmentItems(items, value).length;
          return count ? (
            <button
              type="button"
              key={value.key}
              aria-pressed={segment === value.key}
              onClick={() => setSegment(value.key)}
            >
              {localized(value.label, locale)}
              <b>{count}</b>
            </button>
          ) : null;
        })}
      </div>
      <div className={c.shelfHead}>
        <span>{t("preview")}</span>
        <span aria-live="polite">
          {visible.length} {t("results")}
        </span>
      </div>
      {visible.length ? (
        <div className={c.previewGrid}>
          {visible.slice(0, 3).map((item) => (
            <BusinessOfferCard key={item.id} item={item} compact />
          ))}
        </div>
      ) : (
        <div className={c.empty}>
          <Layers3 size={28} />
          <p>{t("noMatching")}</p>
          <a className={c.outlineButton} href="#world-enquiry">
            {t("next")}
            <ArrowUpRight size={16} />
          </a>
        </div>
      )}
      <SelectionFeedback />
      {world === "partner-os" ? <PlanSelection /> : null}
    </section>
  );
}

export function IntentMatches({
  dimension,
  index,
}: {
  dimension: string;
  index: number;
}) {
  const { experience } = useWorld(),
    t = useCopy();
  const items = contextualItems(experience.items, dimension, index);
  if (items === null) return null;
  return (
    <div className={c.contextMatches} data-business-matches={dimension}>
      <div className={c.shelfHead}>
        <strong>{t("matching")}</strong>
        <span aria-live="polite">
          {items.length} {t("results")}
        </span>
      </div>
      {items.length ? (
        <div className={c.previewGrid}>
          {items.slice(0, 3).map((item) => (
            <BusinessOfferCard item={item} key={item.id} compact />
          ))}
        </div>
      ) : (
        <p>{t("noMatching")}</p>
      )}
      <a className={c.inlineLink} href="#world-offers">
        {t("full")}
        <ArrowUpRight size={15} />
      </a>
    </div>
  );
}

type Filters = {
  query: string;
  schema: string;
  availability: string;
  sort: string;
  view: string;
  factKey: string;
  factValue: string;
};
const INITIAL: Filters = {
  query: "",
  schema: "all",
  availability: "all",
  sort: "recommended",
  view: "all",
  factKey: "",
  factValue: "all",
};
export function CommerceCatalogue() {
  const { experience, locale, world, selections } = useWorld(),
    t = useCopy();
  const [filters, setFilters] = useState<Filters>(INITIAL),
    [limit, setLimit] = useState(8),
    [ready, setReady] = useState(false);
  const query = useDeferredValue(filters.query),
    profile = COMMERCIAL_PROFILES[world],
    items = experience.items;
  const facets = useMemo(
    () =>
      profile.fields.flatMap((key) => {
        const fields = items.flatMap(
            (item) =>
              projection(item)?.fields.filter((field) => field.key === key) ||
              [],
          ),
          values = [...new Set(fields.flatMap((field) => field.values))];
        return values.length > 1 && values.length <= 16
          ? [{ key, label: fields[0].label, values }]
          : [];
      }),
    [items, profile],
  );
  useEffect(() => {
    const params = new URLSearchParams(window.location.search),
      value = (name: keyof Filters) => params.get(`sf_${name}`);
    setFilters({
      query: (value("query") || "").slice(0, 200),
      schema: value("schema") || "all",
      availability: value("availability") || "all",
      sort: ["recommended", "name", "price_asc", "price_desc"].includes(
        value("sort") || "",
      )
        ? value("sort")!
        : "recommended",
      view: ["all", "saved", "compare"].includes(value("view") || "")
        ? value("view")!
        : "all",
      factKey: value("factKey") || "",
      factValue: value("factValue") || "all",
    });
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    for (const key of Object.keys(INITIAL) as (keyof Filters)[]) {
      if (filters[key] && filters[key] !== INITIAL[key])
        url.searchParams.set(`sf_${key}`, filters[key]);
      else url.searchParams.delete(`sf_${key}`);
    }
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [filters, ready]);
  const update = (patch: Partial<Filters>) => {
    setFilters((previous) => ({ ...previous, ...patch }));
    setLimit(8);
  };
  const reset = () => {
    setFilters(INITIAL);
    setLimit(8);
  };
  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale);
    const filtered = items.filter((item) => {
      const info = projection(item);
      if (filters.schema !== "all" && schemaOf(item) !== filters.schema)
        return false;
      if (
        filters.availability !== "all" &&
        item.availability_status !== filters.availability
      )
        return false;
      if (filters.view === "saved" && !selections.saved.includes(item.id))
        return false;
      if (filters.view === "compare" && !selections.compared.includes(item.id))
        return false;
      if (
        filters.factKey &&
        filters.factValue !== "all" &&
        !info?.fields.some(
          (field) =>
            field.key === filters.factKey &&
            field.values.includes(filters.factValue),
        )
      )
        return false;
      return (
        !q ||
        [
          item.name,
          item.short_description || "",
          info?.schemaLabel || "",
          ...(info?.fields.map((field) => field.value) || []),
        ]
          .join(" ")
          .toLocaleLowerCase(locale)
          .includes(q)
      );
    });
    return filters.sort === "name"
      ? [...filtered].sort(
          (a, b) =>
            a.name.localeCompare(b.name, locale) || a.id.localeCompare(b.id),
        )
      : filters.sort.startsWith("price_")
        ? [...filtered].sort((a, b) => {
            const pa = a.price_mode === "quote_only" ? null : a.price_amount,
              pb = b.price_mode === "quote_only" ? null : b.price_amount;
            if (pa === null || pb === null)
              return pa === pb
                ? a.id.localeCompare(b.id)
                : pa === null
                  ? 1
                  : -1;
            return (
              (filters.sort === "price_desc" ? pb - pa : pa - pb) ||
              a.id.localeCompare(b.id)
            );
          })
        : filtered;
  }, [
    items,
    query,
    filters.schema,
    filters.availability,
    filters.view,
    filters.factKey,
    filters.factValue,
    filters.sort,
    selections.saved,
    selections.compared,
    locale,
  ]);
  const schemas = [
    ...new Map(
      items.map((item) => [
        schemaOf(item),
        projection(item)?.schemaLabel || schemaOf(item),
      ]),
    ).entries(),
  ].filter(([key]) => key);
  const statuses = [
    ...new Set(items.map((item) => item.availability_status).filter(Boolean)),
  ];
  const facet = facets.find((value) => value.key === filters.factKey),
    active = Object.keys(INITIAL).filter(
      (key) => filters[key as keyof Filters] !== INITIAL[key as keyof Filters],
    ).length;
  return (
    <section
      id="world-offers"
      className={c.catalogue}
      data-business-commerce="complete-catalogue"
    >
      <header className={c.openingHead}>
        <div>
          <span className={c.eyebrow}>
            <ListFilter size={15} />
            {t("catalogue")}
          </span>
          <h2>{localized(profile.title, locale)}</h2>
          <p>{localized(profile.lead, locale)}</p>
        </div>
        <span className={c.count}>
          {items.length} {t("live")}
        </span>
      </header>
      <div className={c.filterPanel}>
        <div className={c.filterTitle}>
          <SlidersHorizontal size={17} />
          <strong>{t("filters")}</strong>
          {active ? (
            <button type="button" onClick={reset}>
              {t("reset")}
              <X size={14} />
            </button>
          ) : null}
        </div>
        <div className={c.filters}>
          <label className={c.query}>
            <span>
              {locale === "fr"
                ? "Rechercher"
                : locale === "ar"
                  ? "بحث"
                  : "Search"}
            </span>
            <div>
              <Search size={17} />
              <input
                value={filters.query}
                maxLength={200}
                onChange={(event) => update({ query: event.target.value })}
              />
            </div>
          </label>
          {schemas.length > 1 ? (
            <label>
              <span>{t("solution")}</span>
              <select
                value={filters.schema}
                onChange={(event) => update({ schema: event.target.value })}
              >
                <option value="all">{t("all")}</option>
                {schemas.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {statuses.length > 1 ? (
            <label>
              <span>{t("availability")}</span>
              <select
                value={filters.availability}
                onChange={(event) =>
                  update({ availability: event.target.value })
                }
              >
                <option value="all">{t("all")}</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {availabilityLabel(
                      { availability_status: status } as DiscoveryItem,
                      locale,
                    )}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            <span>
              {locale === "fr" ? "Trier" : locale === "ar" ? "ترتيب" : "Sort"}
            </span>
            <select
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value })}
            >
              <option value="recommended">{t("recommended")}</option>
              <option value="name">{t("name")}</option>
              <option value="price_asc">{t("price")} ↑</option>
              <option value="price_desc">{t("price")} ↓</option>
            </select>
          </label>
          {facets.length ? (
            <label>
              <span>{t("scope")}</span>
              <select
                value={filters.factKey}
                onChange={(event) =>
                  update({ factKey: event.target.value, factValue: "all" })
                }
              >
                <option value="">{t("all")}</option>
                {facets.map((value) => (
                  <option value={value.key} key={value.key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {facet ? (
            <label>
              <span>{facet.label}</span>
              <select
                value={filters.factValue}
                onChange={(event) => update({ factValue: event.target.value })}
              >
                <option value="all">{t("all")}</option>
                {facet.values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>
      <div className={c.resultBar}>
        <div className={c.viewTabs} role="group" aria-label={t("catalogue")}>
          {(["all", "saved", "compare"] as const).map((view) => (
            <button
              key={view}
              type="button"
              aria-pressed={filters.view === view}
              onClick={() => update({ view })}
            >
              {t(view)}
              <b>
                {view === "all"
                  ? items.length
                  : view === "saved"
                    ? selections.saved.length
                    : selections.compared.length}
              </b>
            </button>
          ))}
        </div>
        <span role="status" aria-live="polite">
          {results.length} {t("results")}
        </span>
      </div>
      <SelectionFeedback />
      {filters.view === "compare" && results.length ? (
        <Comparison items={results} />
      ) : null}
      <div className={c.grid} id="world-offer-grid">
        {results.slice(0, limit).map((item) => (
          <BusinessOfferCard key={item.id} item={item} />
        ))}
      </div>
      {!results.length ? (
        <div className={c.empty}>
          <Search size={28} />
          <p>{t("noMatching")}</p>
          <button className={c.outlineButton} type="button" onClick={reset}>
            {t("reset")}
          </button>
          <a href="#world-enquiry">
            {t("next")}
            <ArrowUpRight size={16} />
          </a>
        </div>
      ) : null}
      {results.length > limit ? (
        <button
          className={c.loadMore}
          aria-controls="world-offer-grid"
          type="button"
          onClick={() => setLimit((value) => value + 8)}
        >
          {t("more")}
          <span>
            +{Math.min(8, results.length - limit)} / {results.length - limit}
          </span>
          <ChevronDown size={17} />
        </button>
      ) : null}
    </section>
  );
}

function Comparison({ items }: { items: DiscoveryItem[] }) {
  const { world, locale, experience } = useWorld(),
    t = useCopy(),
    profile = COMMERCIAL_PROFILES[world];
  const selected = items.slice(0, 4),
    allFields = uniqueFacts(selected),
    keys = [
      ...new Set([...profile.fields, ...allFields.map((field) => field.key)]),
    ]
      .filter((key) => allFields.some((field) => field.key === key))
      .slice(0, 12);
  return (
    <div
      className={c.comparison}
      tabIndex={0}
      role="region"
      aria-label={t("compare")}
    >
      <table>
        <caption>{t("compare")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("scope")}</th>
            {selected.map((item) => (
              <th scope="col" key={item.id}>
                <Link
                  href={businessItemHref(
                    item,
                    locale,
                    experience.territoryCode,
                  )}
                >
                  {item.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{t("price")}</th>
            {selected.map((item) => (
              <td key={item.id}>{priceLabel(item, locale)}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">{t("availability")}</th>
            {selected.map((item) => (
              <td key={item.id}>{availabilityLabel(item, locale)}</td>
            ))}
          </tr>
          {keys.map((key) => (
            <tr key={key}>
              <th scope="row">
                {allFields.find((field) => field.key === key)?.label}
              </th>
              {selected.map((item) => (
                <td key={item.id}>
                  {projection(item)?.fields.find((field) => field.key === key)
                    ?.value || t("noValue")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function uniqueFacts(items: DiscoveryItem[]) {
  return [
    ...new Map(
      items
        .flatMap((item) => projection(item)?.fields || [])
        .map((field) => [field.key, field]),
    ).values(),
  ];
}

export function CommerceCollections() {
  const { experience } = useWorld(),
    t = useCopy(),
    [limit, setLimit] = useState(2),
    [expanded, setExpanded] = useState<string[]>([]);
  if (!experience.collections.length) return null;
  return (
    <section className={c.collections} id="world-collections">
      <header className={c.openingHead}>
        <div>
          <span className={c.eyebrow}>
            <Layers3 size={15} />
            {t("collections")}
          </span>
          <h2>{t("collections")}</h2>
        </div>
      </header>
      {experience.collections.slice(0, limit).map((collection) => {
        const items = uniqueItems(collection.items),
          open = expanded.includes(collection.id);
        return (
          <div className={c.collection} key={collection.id}>
            <div className={c.shelfHead}>
              <div>
                <h3>{collection.title}</h3>
                {collection.subtitle ? <p>{collection.subtitle}</p> : null}
              </div>
              <span>
                {items.length} {t("results")}
              </span>
            </div>
            <div className={c.previewGrid}>
              {items.slice(0, open ? items.length : 3).map((item) => (
                <BusinessOfferCard key={item.id} item={item} compact />
              ))}
            </div>
            {!open && items.length > 3 ? (
              <button
                className={c.outlineButton}
                type="button"
                onClick={() =>
                  setExpanded((previous) => [...previous, collection.id])
                }
              >
                {t("more")} (+{items.length - 3})<ChevronDown size={15} />
              </button>
            ) : null}
          </div>
        );
      })}
      {experience.collections.length > limit ? (
        <button
          className={c.loadMore}
          type="button"
          onClick={() => setLimit((value) => value + 2)}
        >
          {t("more")} (+{experience.collections.length - limit})
        </button>
      ) : null}
    </section>
  );
}

export function PlanSelection() {
  const { world, locale, native, plan, choosePlan, experience } = useWorld(),
    t = useCopy();
  const plans = native.resources.filter((resource) => resource.kind === "plan");
  if (world !== "partner-os" || !plans.length) return null;
  return (
    <section className={c.plans} id="world-plans">
      <header className={c.openingHead}>
        <div>
          <span className={c.eyebrow}>PARTNER OS</span>
          <h2>{t("nativePlans")}</h2>
          <p>{localized(COMMERCIAL_PROFILES[world].lead, locale)}</p>
        </div>
      </header>
      <div className={c.planGrid}>
        {plans.map((resource) => {
          const chosen = plan?.id === resource.id,
            linked = experience.items.find(
              (item) => projection(item)?.linkedPlanId === resource.id,
            ),
            action = linked
              ? nativeAction(linked, locale, experience.territoryCode)
              : null;

          return (
            <article
              className={c.plan}
              data-selected={chosen}
              key={resource.id}
            >
              <span className={c.eyebrow}>PARTNER OS</span>
              <h3>{resource.title}</h3>
              {resource.body ? <p lang="fr">{resource.body}</p> : null}
              <strong className={c.planPrice}>
                {resource.amount != null
                  ? `${new Intl.NumberFormat(locale).format(resource.amount)} ${resource.currency || ""}`
                  : t("scopeConfirm")}
                {resource.period && resource.amount != null ? (
                  <small> / {PLAN_PERIODS[resource.period][locale]}</small>
                ) : null}
              </strong>
              {resource.modules != null ? (
                <span className={c.planModules}>
                  <Layers3 size={16} />
                  {resource.modules} {t("moduleCount")}
                </span>
              ) : null}
              {resource.sourceLocale !== locale ? (
                <small>{t("sourceFr")}</small>
              ) : null}
              <ul>
                {resource.facts.map((fact) => (
                  <li key={fact}>
                    <Check size={14} />
                    {fact}
                  </li>
                ))}
              </ul>
              <button
                className={c.nativeAction}
                type="button"
                aria-pressed={chosen}
                onClick={() => choosePlan(chosen ? null : resource)}
              >
                {t(chosen ? "chosenPlan" : "choosePlan")}
                {chosen ? <Check size={16} /> : <ArrowUpRight size={16} />}
              </button>
              {chosen ? (
                <a className={c.inlineLink} href="#world-enquiry">
                  {t("next")}
                  <ArrowDown size={15} />
                </a>
              ) : null}
              {action ? (
                <Link className={c.inlineLink} href={action.href}>
                  {action.label}
                  <ArrowUpRight size={15} />
                </Link>
              ) : null}
            </article>
          );
        })}
      </div>
      <div
        className={c.comparison}
        role="region"
        tabIndex={0}
        aria-label={t("compare")}
      >
        <table>
          <caption>{t("compare")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("scope")}</th>
              {plans.map((resource) => (
                <th scope="col" key={resource.id}>
                  {resource.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{t("price")}</th>
              {plans.map((resource) => (
                <td key={resource.id}>
                  {resource.amount == null
                    ? t("noValue")
                    : `${new Intl.NumberFormat(locale).format(resource.amount)} ${resource.currency || ""}`}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">{t("moduleCount")}</th>
              {plans.map((resource) => (
                <td key={resource.id}>{resource.modules ?? t("noValue")}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">
                {locale === "fr"
                  ? "Facturation"
                  : locale === "ar"
                    ? "الفوترة"
                    : "Billing"}
              </th>
              {plans.map((resource) => (
                <td key={resource.id}>
                  {resource.period
                    ? PLAN_PERIODS[resource.period][locale]
                    : t("noValue")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ProjectSummary() {
  const {
      project,
      plan,
      locale,
      experience,
      toggleProject,
      choosePlan,
      brief,
    } = useWorld(),
    t = useCopy();
  if (!project.length && !plan) return null;
  return (
    <section id="world-project" className={c.project}>
      <div>
        <span className={c.eyebrow}>
          <Layers3 size={15} />
          {t("project")}
        </span>
        <h2>{t("project")}</h2>
        <p>{t("projectLead")}</p>
      </div>
      <ul>
        {project.map((item) => (
          <li key={item.id}>
            <Link
              href={businessItemHref(item, locale, experience.territoryCode)}
            >
              {item.name}
            </Link>
            <button
              type="button"
              onClick={() => toggleProject(item.id)}
              aria-label={`${t("remove")}: ${item.name}`}
            >
              <X size={16} />
            </button>
          </li>
        ))}
        {plan ? (
          <li>
            <span>PARTNER OS · {plan.title}</span>
            <button
              type="button"
              onClick={() => choosePlan(null)}
              aria-label={`${t("remove")}: ${plan.title}`}
            >
              <X size={16} />
            </button>
          </li>
        ) : null}
      </ul>
      <details>
        <summary>{t("scope")}</summary>
        <p className={c.briefText}>{brief}</p>
      </details>
      <a className={c.nativeAction} href="#world-enquiry">
        {t("next")}
        <ArrowDown size={16} />
      </a>
    </section>
  );
}
