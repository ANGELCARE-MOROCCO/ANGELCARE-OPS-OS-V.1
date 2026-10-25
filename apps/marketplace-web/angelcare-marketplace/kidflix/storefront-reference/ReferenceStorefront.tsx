"use client";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { path, tr, world, WORLDS, type Locale, type Tri } from "../catalogue";
import { I } from "./CategoryIcon";
import { useGuest } from "../continuity";
import { Modal, FactsView } from "../storefronts/elements";
import { PublisherGallery } from "../storefronts/PublisherGallery";
import { defaults } from "../storefronts/themes";
import {
  optionText,
  type Edition,
  type StorefrontData,
  type Section,
} from "../storefronts/model";
import { PageAd } from "../journey/Runtime";
import { Art } from "./CategoryShell";
import {
  ART,
  workspaceHref,
  STAGES,
  PRINT_PACKS,
  primaryCount,
  customImage,
  needChoices,
  quickChoices,
  PAGE_SIZE,
  PROFILES,
  FAMILIES,
  profile,
  subtypes,
  focusChoices,
  NEEDS,
  THEMES,
  QUICK,
  cleanFilters,
  detailHref,
  discoveryHref,
  hasCustomGallery,
  text,
  type ReferenceItem,
} from "./model";
import s from "./reference.module.css";
const focusArtByFamily: Record<string, number[]> = {
  printables: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  stories: [18, 6, 8, 13, 10, 11, 21, 13, 14, 4, 16, 28],
  learning: [28, 6, 8, 9, 10, 17, 12, 13, 14, 4, 16, 28],
  video: [27, 6, 8, 9, 10, 11, 12, 13, 14, 4, 16, 21],
  audio: [26, 6, 18, 26, 10, 28, 11, 13, 14, 33, 16, 21],
  "visual-cards": [8, 6, 0, 9, 10, 11, 30, 13, 14, 4, 16, 21],
  presentations: [29, 6, 18, 19, 10, 11, 21, 13, 14, 5, 16, 28],
  assessments: [8, 6, 18, 9, 10, 11, 30, 20, 14, 4, 16, 28],
  activities: [6, 21, 18, 9, 10, 11, 12, 13, 14, 1, 16, 28],
  tools: [9, 33, 32, 9, 10, 11, 32, 13, 20, 17, 1, 28],
  planners: [33, 21, 8, 19, 5, 17, 21, 13, 14, 4, 16, 1],
  forms: [34, 21, 17, 30, 8, 4, 25, 13, 14, 33, 16, 28],
  community: [21, 6, 8, 30, 10, 28, 21, 13, 14, 4, 16, 5],
  commerce: [17, 6, 8, 9, 10, 11, 12, 13, 14, 4, 16, 28],
  bundles: [35, 6, 8, 9, 10, 11, 17, 13, 14, 33, 16, 28],
};
const nativeArt: Record<string, number[]> = {
  printables: [0, 1, 2, 3, 4, 5],
  stories: [18, 14, 8, 1, 6, 25],
  learning: [28, 1, 10, 13, 23, 17],
  video: [27, 13, 11, 10, 23, 25],
  audio: [26, 18, 14, 28, 1, 22],
  "visual-cards": [8, 0, 10, 13, 4, 6],
  presentations: [29, 29, 18, 28, 5, 19],
  assessments: [30, 28, 22, 11, 17, 31],
  activities: [31, 10, 13, 1, 23, 11],
  tools: [9, 33, 10, 32, 15, 16],
  planners: [33, 19, 4, 5, 1, 23],
  forms: [17, 33, 28, 14, 34, 4],
  community: [14, 17, 23, 30, 13, 5],
  commerce: [5, 25, 28, 8, 15, 1],
  bundles: [35, 35, 8, 22, 5, 23],
};
const stageChoices = STAGES.map((s) => ({ key: s.key, label: s.title }));
function Atlas({
  sheet,
  index,
  columns = 4,
  rows = 4,
  className = "",
}: {
  sheet: string;
  index: number;
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <span
      className={`${s.atlas} ${className}`}
      aria-hidden="true"
      style={{
        backgroundImage: `url(${ART}${sheet}.png)`,
        backgroundSize: rows===1?`${columns*100}% auto`:`${columns * 100}% ${rows * 100}%`,
        backgroundPosition: `${columns > 1 ? ((index % columns) * 100) / (columns - 1) : 0}% ${rows > 1 ? (Math.floor(index / columns) * 100) / (rows - 1) : 60}%`,
      }}
    />
  );
}
function Heading({
  icon,
  title,
  children,
  action,
}: {
  icon: number;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={s.heading}>
      <h2>
        <Art index={icon} />
        {title}
      </h2>
      {children ? <small>{children}</small> : null}
      {action}
    </div>
  );
}
function ScrollLink({
  children,
  target = "discover",
}: {
  children: ReactNode;
  target?: string;
}) {
  return (
    <a className={s.viewAll} href={`#${target}`}>
      {children}
      <I name="ArrowRight" size={14} />
    </a>
  );
}
function ResourceCard({
  item,
  locale,
  kind,
  onPreview,
  onShare,
}: {
  item: ReferenceItem;
  locale: Locale;
  kind: string;
  onPreview: (r: ReferenceItem) => void;
  onShare: (r: ReferenceItem) => void;
}) {
  const guest = useGuest(),
    saved = guest.saved.includes(item.key),
    href = detailHref(item, locale),
    age =
      item.ageMin !== null && item.ageMax !== null
        ? `${item.ageMin}–${item.ageMax} ${tr(["years", "ans", "سنوات"], locale)}`
        : "",
    countEntry = primaryCount(item);
  const action =
    (kind === "paper" || kind === "plan") && item.facts.formats.length > 0
      ? "Download"
      : ["screen", "sound"].includes(kind)
        ? "Play"
        : kind === "book"
          ? "BookOpen"
          : "ArrowRight";
  return (
    <article
      className={s.resourceCard}
      data-resource-key={item.key}
      data-card-kind={kind}
    >
      <Link
        className={s.cover}
        href={href}
        onClick={() => guest.visit(item.key)}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.imageAlt || item.title}
            width={320}
            height={300}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.hidden = true;
              e.currentTarget.parentElement?.setAttribute(
                "data-image-failed",
                "true",
              );
            }}
          />
        ) : (
          <span className={s.noCover}>
            <Art index={nativeArt[item.family]?.[0] || 8} />
            <small>{text("noPreview", locale)}</small>
          </span>
        )}
        {item.duration !== null && ["screen", "sound"].includes(kind) ? (
          <span className={s.duration}>
            {item.duration} {tr(["min", "min", "د"], locale)}
          </span>
        ) : null}
        <span className={s.imageFailed}>{text("noPreview", locale)}</span>
      </Link>
      <div className={s.cardBody}>
        <Link
          className={s.cardTitle}
          href={href}
          onClick={() => guest.visit(item.key)}
        >
          {item.title}
        </Link>
        <div className={s.tags}>
          {[item.subject, ...item.skills]
            .filter(Boolean)
            .slice(0, 2)
            .map((v, i) => (
              <span key={v + i}>{v}</span>
            ))}
        </div>
        <div className={s.meta}>
          {age ? <span>{age}</span> : null}
          {countEntry ? (
            <span>
              {countEntry.value} {tr(countEntry.label, locale)}
            </span>
          ) : null}
        </div>
        <div className={s.cardBottom}>
          {typeof item.loveCount === "number" ? (
            <span
              className={s.realMetric}
              title={tr(["Hearts", "Cœurs", "إعجابات"], locale)}
            >
              ♥ {item.loveCount}
            </span>
          ) : (
            <span
              className={s.unrated}
              aria-label={text("unrated", locale)}
              title={text("unrated", locale)}
            >
              <b aria-hidden="true">★</b> –
            </span>
          )}
          <Link
            className={s.cardAction}
            href={workspaceHref(item, locale)}
            aria-label={`${text(action === "Download" ? "download" : "open", locale)} · ${item.title}`}
            onClick={() => guest.visit(item.key)}
          >
            <I name={action} size={19} />
          </Link>
        </div>
      </div>
      <div className={s.cardMore}>
        <button
          aria-label={text("preview", locale) + " · " + item.title}
          onClick={() => onPreview(item)}
        >
          <I name="Eye" size={15} />
          <span>{text("preview", locale)}</span>
        </button>
        <button
          onClick={() => guest.toggle(item.key)}
          aria-pressed={saved}
          aria-label={
            text(saved ? "saved" : "save", locale) + " · " + item.title
          }
        >
          <I name="Bookmark" size={15} />
        </button>
        <button
          onClick={() => onShare(item)}
          aria-label={text("share", locale) + " · " + item.title}
        >
          <I name="Share2" size={15} />
        </button>
      </div>
    </article>
  );
}
export function ReferenceStorefront({
  family,
  locale,
  initial,
  initialFilters = {},
  previewEdition,
}: {
  family: string;
  locale: Locale;
  initial: StorefrontData;
  initialFilters?: Record<string, string>;
  previewEdition?: Edition;
}) {
  const w = world(family)!,
    p = profile(family),
    focusArt = focusArtByFamily[family],
    NEEDS = needChoices(family),
    QUICK = quickChoices(family),
    [data, setData] = useState(initial),
    [values, setValues] = useState(() => cleanFilters(initialFilters, family)),
    [search, setSearch] = useState(initialFilters.q || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(initial.catalogue.error === true),
    [setup, setSetup] = useState(initial.setupRequired === true),
    [retry, setRetry] = useState(0),
    [view, setView] = useState<"grid" | "list">("grid"),
    [quick, setQuick] = useState<ReferenceItem | null>(null),
    [workspace, setWorkspace] = useState(false),
    [directory, setDirectory] = useState<
      "categories" | "focus" | "need" | null
    >(null),
    [share, setShare] = useState<{ url: string; copied: boolean } | null>(null),
    started = useRef(false),
    last = useRef(JSON.stringify(cleanFilters(initialFilters, family))),
    key = JSON.stringify(values),
    edition = previewEdition || data.edition;
  useEffect(() => {
    if (previewEdition) return;
    const pop = () => {
      try {
        const f = cleanFilters(
          Object.fromEntries(new URLSearchParams(location.search)),
          family,
        );
        last.current = JSON.stringify(f);
        setValues(f);
        setSearch(f.q || "");
      } catch {
        setError(true);
      }
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [family, previewEdition]);
  useEffect(() => {
    if (previewEdition) return;
    if (!started.current && !retry) {
      started.current = true;
      return;
    }
    started.current = true;
    const controller = new AbortController();
    let active = true;
    setBusy(true);
    setError(false);
    setSetup(false);
    if (last.current !== key) {
      history.pushState(null, "", discoveryHref(locale, family, values));
      last.current = key;
    }
    fetch(
      "/api/kidflix/storefront?" +
        new URLSearchParams({ locale, family, ...values }),
      {
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(30000),
        ]),
      },
    )
      .then(async (r) => {
        const result = await r.json();
        if (!r.ok) {
          if (active) setSetup(result?.error === "CATALOGUE_SETUP_REQUIRED");
          throw Error();
        }
        if (
          !Array.isArray(result?.catalogue?.rows) ||
          !result.edition ||
          result.catalogue.pageSize !== PAGE_SIZE
        )
          throw Error();
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [key, retry, family, locale, previewEdition]);
  const update = (name: string, value: string) =>
      setValues((old) =>
        cleanFilters({ ...old, page: "1", [name]: value }, family),
      ),
    select = (name: string, value: string) => {
      update(name, value);
      document.getElementById("discover")?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    },
    reset = () => {
      setSearch("");
      setValues({});
    },
    rows = data.catalogue.rows as ReferenceItem[],
    choices = focusChoices(family),
    native = subtypes(family),
    page = Math.max(1, Number(values.page) || 1),
    totalPages = Math.max(1, Math.ceil(data.catalogue.total / PAGE_SIZE)),
    customGallery = hasCustomGallery({ ...data, edition }, family),
    base = defaults(family, locale),
    headline =
      edition.headline !== base.headline
        ? edition.headline
        : family === "printables"
          ? tr(
              [
                "Free Printables & Worksheets",
                "Fiches & activités à imprimer",
                "أوراق وأنشطة مجانية للطباعة",
              ],
              locale,
            )
          : tr(w.title, locale),
    description =
      edition.description !== base.description
        ? edition.description
        : tr(p.body, locale);
  const shareResource = async (item: ReferenceItem) => {
    setQuick(null);
    const url = new URL(detailHref(item, locale), location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShare({ url, copied: true });
    } catch {
      setShare({ url, copied: false });
    }
  };
  const card = (r: ReferenceItem) => (
    <ResourceCard
      key={r.key}
      item={r}
      locale={locale}
      kind={p.kind}
      onPreview={setQuick}
      onShare={(r) => void shareResource(r)}
    />
  );
  const choiceLabel = (field: string, value: string) => {
    if (field === "subtype")
      return native.find((c) => c.id === value)
        ? tr(native.find((c) => c.id === value)!.label, locale)
        : value;
    const sets: Record<string, readonly { key: string; title: Tri }[]> = {
      focus: choices,
      theme: THEMES,
      need: NEEDS,
      quick: QUICK,
    };
    const c = sets[field]?.find((c) => c.key === value);
    if (c) return tr(c.title, locale);
    if (field === "stage")
      return tr(
        STAGES.find((s) => s.key === value)?.title || [value, value, value],
        locale,
      );
    if (field === "age")
      return `${value} ${tr(["years", "ans", "سنوات"], locale)}`;
    if (field === "orientation")
      return tr(
        value === "portrait"
          ? ["Portrait", "Portrait", "عمودي"]
          : ["Landscape", "Paysage", "أفقي"],
        locale,
      );
    if (field === "colourMode")
      return tr(
        value === "colour"
          ? ["Colour", "Couleur", "ألوان"]
          : [
              "Grayscale / Low ink",
              "Gris / Économie d’encre",
              "تدرج رمادي / حبر أقل",
            ],
        locale,
      );
    return optionText(field, value, locale);
  };
  const selectField = (
    field: string,
    label: keyof typeof import("./model").WORDS,
    options: readonly string[],
  ) => (
    <label key={field}>
      <span>{text(label, locale)}</span>
      <select
        aria-label={text(label, locale)}
        value={values[field] || ""}
        onChange={(e) => update(field, e.target.value)}
      >
        <option value="">{text("all", locale)}</option>
        {[
          ...new Set([...options, ...(values[field] ? [values[field]] : [])]),
        ].map((v) => (
          <option key={v} value={v}>
            {choiceLabel(field, v)}
          </option>
        ))}
      </select>
    </label>
  );
  const filters = (
    <section className={s.filters} aria-labelledby="reference-filters">
      <div className={s.filterTitle}>
        <span className={s.searchIcon}><I name="Search" size={38}/></span>
        <div>
          <h2 id="reference-filters">{text("filters", locale)}</h2>
          <p>{text("searchHelp", locale)}</p>
        </div>
        {family === "printables" ? (
          <Atlas
            sheet="printable-packs"
            index={0}
            columns={5}
            rows={1}
            className={s.searchPapers}
          />
        ) : null}
      </div>
      <form
        className={s.searchForm}
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          update("q", search.trim());
          document
            .getElementById("discover")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <label>
          <I name="Search" size={19} />
          <input
            type="search"
            maxLength={100}
            value={search}
            aria-label={text("search", locale)}
            placeholder={text("searchHelp", locale)}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button className={s.primary}>{text("search", locale)}</button>
      </form>
      <div className={s.filterGrid}>
        {selectField(
          "subtype",
          "type",
          native.map((c) => c.id),
        )}
        {selectField(
          "stage",
          "age",
          STAGES.map((s) => s.key),
        )}
        {selectField("subject", "subject", data.facets.subject || [])}
        {selectField(
          "focus",
          "focus",
          choices.map((c) => c.key),
        )}
        {selectField(
          "theme",
          "theme",
          THEMES.map((c) => c.key),
        )}
        <label>
          <span>{text("language", locale)}</span>
          <select
            aria-label={text("language", locale)}
            value={locale}
            onChange={(e) =>
              location.assign(
                discoveryHref(e.target.value as Locale, family, values),
              )
            }
          >
            {(["en", "fr", "ar"] as const).map((l) => (
              <option key={l} value={l}>
                {{ en: "English", fr: "Français", ar: "العربية" }[l]}
              </option>
            ))}
          </select>
        </label>
        {family === "printables" ? (
          <>
            {selectField("paper", "paper", ["A4", "A5", "Letter"])}
            {selectField("orientation", "orientation", [
              "portrait",
              "landscape",
            ])}
            {selectField("colourMode", "colourMode", ["colour", "grayscale"])}
          </>
        ) : (
          <>
            {selectField("audience", "audience", data.facets.audience || [])}
            {selectField(
              "difficulty",
              "difficulty",
              data.facets.difficulty || [],
            )}
            {selectField("duration", "duration", ["5", "10", "15", "30", "60"])}
          </>
        )}
        {selectField("format", "format", data.facets.format || [])}
      </div>
      <div className={s.quickFilters}>
        <b>{text("quick", locale)}:</b>
        {family === "printables" ? (
          <button
            aria-pressed={values.colourMode === "grayscale"}
            onClick={() =>
              update(
                "colourMode",
                values.colourMode === "grayscale" ? "" : "grayscale",
              )
            }
          >
            {tr(["Low ink", "Économie d’encre", "حبر أقل"], locale)}
          </button>
        ) : null}
        {QUICK.map((c) => (
          <button
            key={c.key}
            aria-pressed={values.quick === c.key}
            onClick={() => update("quick", values.quick === c.key ? "" : c.key)}
          >
            {tr(c.title, locale)}
          </button>
        ))}
      </div>
      <div className={s.resultControls}>
        <span>
          {previewEdition
            ? tr(
                ["Studio preview", "Aperçu Studio", "معاينة الاستوديو"],
                locale,
              )
            : busy
              ? text("loading", locale)
              : error
                ? text("error", locale)
                : `${new Intl.NumberFormat(locale).format(data.catalogue.total)} ${text("results", locale)}`}
        </span>
        <div>
          <button onClick={reset}>
            <I name="RotateCcw" size={16} />
            {text("reset", locale)}
          </button>
          <button
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
          >
            <I name="LayoutGrid" size={16} />
            {text("grid", locale)}
          </button>
          <button
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            <I name="List" size={16} />
            {text("list", locale)}
          </button>
        </div>
      </div>
    </section>
  );
  const catalogue = (
    <>
      <div className={s.discoveryOpening}>
        {filters}
        <section className={s.section} id="subcategories">
          <Heading
            icon={5}
            title={text("categories", locale)}
            action={
              <button
                className={s.viewAll}
                onClick={() => setDirectory("categories")}
              >
                {text("viewAll", locale)}
                <I name="ArrowRight" size={14} />
              </button>
            }
          />
          <div className={s.sixTiles}>
            {native.map((c, i) => (
              <button
                className={s.tile}
                key={c.id}
                aria-pressed={values.subtype === c.id}
                onClick={() =>
                  select("subtype", values.subtype === c.id ? "" : c.id)
                }
              >
                <Art index={nativeArt[family][i]} />
                <strong>{tr(c.label, locale)}</strong>
              </button>
            ))}
          </div>
        </section>
        <section className={s.section}>
          <Heading
            icon={5}
            title={text("focusTitle", locale)}
            action={
              <button
                className={s.viewAll}
                onClick={() => setDirectory("focus")}
              >
                {text("viewAll", locale)}
                <I name="ArrowRight" size={14} />
              </button>
            }
          />
          <div className={s.sixTiles}>
            {choices.map((c, i) => (
              <button
                className={s.tile}
                key={c.key}
                aria-pressed={values.focus === c.key}
                onClick={() =>
                  select("focus", values.focus === c.key ? "" : c.key)
                }
              >
                <Art index={focusArt[i]} />
                <strong>{tr(c.title, locale)}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
      <section
        className={s.section}
        id="discover"
        aria-label={text("catalogue", locale)}
      >
        <Heading
          icon={family === "printables" ? 25 : nativeArt[family][0]}
          title={text(
            family === "printables" ? "printables" : "catalogue",
            locale,
          )}
          action={
            <label className={s.sort}>
              <span>{text("sort", locale)}</span>
              <select
                aria-label={text("sort", locale)}
                value={values.sort || "new"}
                onChange={(e) => update("sort", e.target.value)}
              >
                <option value="new">{text("new", locale)}</option>
                <option value="title">{text("title", locale)}</option>
              </select>
            </label>
          }
        />
        <div className={s.activeFilters}>
          {Object.entries(values)
            .filter(([k]) => !["page", "sort"].includes(k))
            .map(([k, v]) => (
              <button
                key={k}
                onClick={() => {
                  update(k, "");
                  if (k === "q") setSearch("");
                }}
              >
                {choiceLabel(k, v)}
                <I name="X" size={12} />
              </button>
            ))}
        </div>
        {error ? (
          <div className={s.empty} role="alert">
            <Art index={34} />
            <h3>{text("error", locale)}</h3>
            {setup ? <p>{text("setup", locale)}</p> : null}
            <button
              className={s.secondary}
              onClick={() => setRetry((n) => n + 1)}
            >
              {text("retry", locale)}
            </button>
          </div>
        ) : rows.length ? (
          <div
            className={`${s.resources} ${view === "list" ? s.listView : ""} ${busy ? s.refreshing : ""}`}
            aria-busy={busy}
            data-resource-grid
          >
            {rows.map(card)}
          </div>
        ) : (
          <div className={s.empty} role="status">
            <Art index={nativeArt[family][0]} />
            <h3>{text(busy ? "loading" : "empty", locale)}</h3>
            <p>{text("emptyHelp", locale)}</p>
            <button className={s.secondary} onClick={reset}>
              {text("reset", locale)}
            </button>
          </div>
        )}
        {!error && data.catalogue.total > PAGE_SIZE ? (
          <nav className={s.pagination} aria-label={text("results", locale)}>
            <button
              disabled={busy || page <= 1}
              onClick={() => select("page", String(page - 1))}
            >
              {text("previous", locale)}
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              disabled={busy || page >= totalPages}
              onClick={() => select("page", String(page + 1))}
            >
              {text("next", locale)}
            </button>
          </nav>
        ) : null}
      </section>
      <section className={s.section}>
        <Heading
          icon={5}
          title={text("needTitle", locale)}
          action={
            <button className={s.viewAll} onClick={() => setDirectory("need")}>
              {text("viewAll", locale)}
              <I name="ArrowRight" size={14} />
            </button>
          }
        />
        <div className={s.sixTiles}>
          {NEEDS.map((c, i) => (
            <button
              className={`${s.tile} ${s.needTile}`}
              aria-pressed={values.need === c.key}
              onClick={() => select("need", values.need === c.key ? "" : c.key)}
              key={c.key}
            >
              <Art
                index={
                  family === "forms"
                    ? [34, 17, 33, 30, 25, 4][i]
                    : family === "community"
                      ? [30, 21, 28, 14, 25, 21][i]
                      : 18 + i
                }
              />
              <strong>{tr(c.title, locale)}</strong>
            </button>
          ))}
        </div>
      </section>
      <section className={`${s.section} ${s.workflow}`} id="category-workspace">
        <Heading
          icon={family === "printables"?24:nativeArt[family][0]}
          title={tr(p.workflow, locale)}
          action={
            <button className={s.primary} onClick={() => setWorkspace(true)}>
              {tr(p.action, locale)}
              <I name="ArrowRight" size={16} />
            </button>
          }
        />
        <ol>
          {p.steps.map((step, i) => (
            <li key={step[0]}>
              <span>{i + 1}</span>
              <div>
                <strong>{tr(step, locale)}</strong>
              </div>
              {i < 3 ? <I name="ChevronRight" size={16} /> : null}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
  const byKey = new Map(data.curated.map((r) => [r.key, r])),
    featured = edition.featured
      .map((k) => byKey.get(k))
      .filter((r): r is ReferenceItem => !!r),
    collections = edition.collections.map((c) => ({
      ...c,
      rows: c.keys
        .map((k) => byKey.get(k))
        .filter((r): r is ReferenceItem => !!r),
    }));
  const packs = (
    <section className={s.section} id="category-collections">
      <Heading
        icon={5}
        title={text(family === "printables" ? "packs" : "collections", locale)}
      >
        <span>{text("packNote", locale)}</span>
      </Heading>
      {featured.length ? (
        <div className={s.resources}>{featured.map(card)}</div>
      ) : null}
      {collections
        .filter((c) => c.rows.length)
        .map((c) => (
          <div key={c.id} className={s.publishedCollection}>
            <h3>{c.title}</h3>
            {c.description ? <p>{c.description}</p> : null}
            <div className={s.resources}>{c.rows.map(card)}</div>
          </div>
        ))}
      <div className={s.packs}>
        {[0, 2, 3, 6, 10].map((n, i) => (
          <button
            key={n}
            className={s.pack}
            onClick={() =>
              select(
                "focus",
                family === "printables" ? PRINT_PACKS[i].focus : choices[n].key,
              )
            }
          >
            {family === "printables" ? (
              <Atlas sheet="printable-packs" columns={5} rows={1} index={i} />
            ) : (
              <div className={s.packScene}>
                <Art index={focusArt[n]} />
                <span>
                  <Art index={nativeArt[family][i]} />
                  <Art index={nativeArt[family][(i + 2) % 6]} />
                </span>
              </div>
            )}
            <strong>
              {family === "printables"
                ? tr(PRINT_PACKS[i].title, locale)
                : tr(choices[n].title, locale)}
            </strong>
            <small>
              {text("viewAll", locale)}
              <I name="ArrowRight" size={12} />
            </small>
          </button>
        ))}
      </div>
    </section>
  );
  const directories = (
    <section className={`${s.section} ${s.directories}`}>
      <div>
        <Heading icon={28} title={text("ageTitle", locale)} />
        <div className={s.directoryGrid}>
          {stageChoices.map((c) => (
            <button key={c.key} onClick={() => select("stage", c.key)}>
              {tr(c.label, locale)}
            </button>
          ))}
          <button onClick={() => select("stage", "")}>
            {text("all", locale)}
          </button>
        </div>
      </div>
      <div>
        <Heading icon={8} title={text("subjects", locale)} />
        <div className={s.directoryGrid}>
          {data.facets.subject?.length
            ? data.facets.subject.slice(0, 12).map((v) => (
                <button onClick={() => select("subject", v)} key={v}>
                  {v}
                </button>
              ))
            : choices.slice(0, 9).map((c) => (
                <button onClick={() => select("focus", c.key)} key={c.key}>
                  {tr(c.title, locale)}
                </button>
              ))}
        </div>
      </div>
      <div>
        <Heading icon={22} title={text("seasons", locale)} />
        <div className={s.seasons}>
          {THEMES.map((c, i) => (
            <button key={c.key} onClick={() => select("theme", c.key)}>
              <span aria-hidden="true">
                {["🎒", "🍁", "🎃", "❄️", "🎉", "🌷", "☀️", "🎓"][i]}
              </span>
              {tr(c.title, locale)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
  const support = (
    <section className={`${s.section} ${s.support}`}>
      <div>
        <Heading icon={24} title={text("tools", locale)} />
        <div className={s.toolButtons}>
          {family === "printables"
            ? [
                ["paper", "A4"],
                ["paper", "Letter"],
                ["orientation", "portrait"],
                ["orientation", "landscape"],
                ["colourMode", "colour"],
                ["colourMode", "grayscale"],
              ].map(([k, v]) => (
                <button key={k + v} onClick={() => select(k, v)}>
                  <I
                    name={
                      k === "paper"
                        ? "FileText"
                        : k === "orientation"
                          ? "LayoutGrid"
                          : "Palette"
                    }
                    size={18}
                  />
                  {choiceLabel(k, v)}
                </button>
              ))
            : native.slice(0, 4).map((c, i) => (
                <button onClick={() => select("subtype", c.id)} key={c.id}>
                  <Art index={nativeArt[family][i]} />
                  {tr(c.label, locale)}
                </button>
              ))}
          <button onClick={() => setWorkspace(true)}>
            <I name={w.icon} size={18} />
            {tr(p.action, locale)}
          </button>
          <Link href={path(locale, "/saved")}>
            <I name="Bookmark" size={18} />
            {text("saved", locale)}
          </Link>
        </div>
      </div>
      <div>
        <Heading icon={19} title={text("progressions", locale)} />
        <div className={s.progressionTiles}>
          {[0, 3, 5, 9].map((n, i) => (
            <button key={n} onClick={() => select("focus", choices[n].key)}>
              <Art index={[8, 19, 11, 17][i]} />
              <strong>{tr(choices[n].title, locale)}</strong>
            </button>
          ))}
        </div>
      </div>
      <div>
        <Heading
          icon={5}
          title={text(
            values.sort === "title" || page > 1 ? "selection" : "recent",
            locale,
          )}
          action={
            <button className={s.viewAll} onClick={() => select("sort", "new")}>
              {text("viewAll", locale)}
            </button>
          }
        />
        {rows.length && !error ? (
          <div className={s.miniResources}>
            {rows.slice(0, 3).map((r) => (
              <Link key={r.key} href={detailHref(r, locale)}>
                {r.image ? (
                  <img
                    src={r.image}
                    width={100}
                    height={90}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <Art index={nativeArt[family][0]} />
                )}
                <strong>{r.title}</strong>
              </Link>
            ))}
          </div>
        ) : (
          <div className={s.miniEmpty}>
            <Art index={nativeArt[family][0]} />
            <span>{text("empty", locale)}</span>
            <ScrollLink>{text("viewAll", locale)}</ScrollLink>
          </div>
        )}
      </div>
    </section>
  );
  const related = (
    <section className={s.related} aria-label={text("related", locale)}>
      <span>{text("related", locale)}</span>
      {WORLDS.filter(
        (o) => o.key !== family && o.intent.some((i) => w.intent.includes(i)),
      )
        .slice(0, 4)
        .map((o) => (
          <Link href={path(locale, "/explore/" + o.key)} key={o.key}>
            {tr(o.title, locale)}
            <I name="ArrowRight" size={12} />
          </Link>
        ))}
    </section>
  );
  const renderSection = (section: Section) =>
    ({
      catalogue,
      collections: packs,
      subjects: directories,
      guide: support,
      related,
    })[section];
  return (
    <div
      className={s.root}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-reference-category={family}
      data-category-kind={p.kind}
      data-density={edition.density}
    >
      <section className={`${s.hero} ${customGallery ? s.customHero : ""}`}>
        <div className={s.heroCopy}>
          {edition.eyebrow !== base.eyebrow ? (
            <small className={s.eyebrow}>{edition.eyebrow}</small>
          ) : null}
          <h1>{headline}</h1>
          <h2>{tr(p.tagline, locale)}</h2>
          <p>{description}</p>
          <a className={s.primary} href="#discover">
            {tr(
              [
                family === "printables" ? "Explore Free Printables" : "Explore " + tr(w.title, "en"),
                "Explorer les ressources",
                "استكشف الموارد",
              ],
              locale,
            )}
            <I name="ArrowRight" size={18} />
          </a>
        </div>
        {customGallery ? (
          <div className={s.heroMedia}>
            <PublisherGallery
              family={family}
              locale={locale}
              scenes={edition.gallery}
            />
          </div>
        ) : family === "printables" ? (
          <img
            className={s.printHeroArt}
            src={ART + "printables-hero.png"}
            alt=""
            width={2048}
            height={683}
            fetchPriority="high"
          />
        ) : (
          <img
            className={s.printHeroArt}
            src={ART + family + "-hero.png"}
            alt=""
            width={2172}
            height={724}
            fetchPriority="high"
          />
        )}
      </section>
      <div className={s.assurances}>
        {(family === "printables"
          ? [
              {
                icon: 24,
                label: ["Ready to Print", "Prêt à imprimer", "جاهز للطباعة"],
                sub: [
                  "High quality pages",
                  "Pages de qualité",
                  "صفحات عالية الجودة",
                ],
              },
              {
                icon: 25,
                label: ["PDF & PNG", "PDF & PNG", "PDF و PNG"],
                sub: ["When published", "Selon publication", "عند النشر"],
              },
              {
                icon: 4,
                label: ["Home & Classroom", "Maison & classe", "المنزل والصف"],
                sub: ["Learning together", "Apprendre ensemble", "التعلم معاً"],
              },
              {
                icon: 13,
                label: [
                  "Colour & Low-Ink",
                  "Couleur & faible encre",
                  "ألوان وحبر أقل",
                ],
                sub: [
                  "Choose your format",
                  "Choisir le format",
                  "اختر التنسيق",
                ],
              },
              {
                icon: 16,
                label: [
                  "Learn Offline",
                  "Apprendre hors ligne",
                  "تعلم دون اتصال",
                ],
                sub: [
                  "With permitted files",
                  "Avec fichiers autorisés",
                  "بملفات مسموحة",
                ],
              },
            ]
          : [
              {
                icon: nativeArt[family][0],
                label: [
                  "Purposeful Discovery",
                  "Découverte utile",
                  "اكتشاف هادف",
                ],
                sub: [
                  "Published resources",
                  "Ressources publiées",
                  "موارد منشورة",
                ],
              },
              {
                icon: 8,
                label: ["Clear Previews", "Aperçus clairs", "معاينات واضحة"],
                sub: [
                  "See before you begin",
                  "Observer avant de commencer",
                  "شاهد قبل البدء",
                ],
              },
              {
                icon: 4,
                label: ["Home & Classroom", "Maison & classe", "المنزل والصف"],
                sub: [
                  "Choose your context",
                  "Choisir son contexte",
                  "اختر سياقك",
                ],
              },
              {
                icon: 16,
                label: ["Inclusive Choices", "Choix inclusifs", "خيارات دامجة"],
                sub: [
                  "Verified classifications",
                  "Classements vérifiés",
                  "تصنيفات مؤكدة",
                ],
              },
              {
                icon: 35,
                label: ["Native Workspace", "Espace natif", "مساحة أصلية"],
                sub: [
                  "Continue your journey",
                  "Poursuivre son parcours",
                  "تابع مسارك",
                ],
              },
            ]
        ).map((a, i) => (
          <div key={i}>
            <Art index={a.icon} />
            <span>
              <strong>{tr(a.label as unknown as Tri, locale)}</strong>
              <small>{tr(a.sub as unknown as Tri, locale)}</small>
            </span>
          </div>
        ))}
      </div>
      {(["cover", "reference", "detail", "guidance"] as const).some((slot) =>
        customImage(edition, family, slot),
      ) ? (
        <section
          className={s.customEditorial}
          aria-label={tr(
            [
              "Published editorial media",
              "Visuels éditoriaux publiés",
              "وسائط تحريرية منشورة",
            ],
            locale,
          )}
        >
          {(["cover", "reference", "detail", "guidance"] as const)
            .filter((slot) => customImage(edition, family, slot))
            .map((slot) => (
              <figure key={slot}>
                <picture>
                  {edition[`${slot}Mobile`] ? (
                    <source
                      media="(max-width:700px)"
                      srcSet={edition[`${slot}Mobile`]}
                    />
                  ) : null}
                  <img
                    src={edition[slot]}
                    alt={edition[`${slot}Alt`]}
                    width={600}
                    height={340}
                    loading="lazy"
                  />
                </picture>
                {slot === "guidance" ? (
                  <figcaption>
                    <h2>{edition.guidanceTitle}</h2>
                    <p>{edition.guidanceBody}</p>
                  </figcaption>
                ) : null}
              </figure>
            ))}
        </section>
      ) : null}
      {edition.adSlots.includes("after-opening") ? (
        <PageAd locale={locale} family={family} slot="after-opening" />
      ) : null}
      {edition.sections.map((section) => (
        <Fragment key={section}>
          {section === "guide" &&
          edition.adSlots.includes("before-guidance") ? (
            <PageAd locale={locale} family={family} slot="before-guidance" />
          ) : null}
          {renderSection(section)}
          {section === "catalogue" &&
          edition.adSlots.includes("after-catalogue") ? (
            <PageAd locale={locale} family={family} slot="after-catalogue" />
          ) : null}
        </Fragment>
      ))}
      {quick ? (
        <QuickPreview
          item={quick}
          locale={locale}
          onClose={() => setQuick(null)}
          onShare={() => void shareResource(quick)}
        />
      ) : null}
      {directory ? (
        <Modal
          title={text("directory", locale)}
          locale={locale}
          onClose={() => setDirectory(null)}
        >
          <p>{text("editorial", locale)}</p>
          <div className={s.modalChoices}>
            {(directory === "categories"
              ? native.map((c) => ({ key: c.id, title: c.label }))
              : directory === "focus"
                ? choices
                : NEEDS
            ).map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  select(
                    directory === "categories"
                      ? "subtype"
                      : directory === "focus"
                        ? "focus"
                        : "need",
                    c.key,
                  );
                  setDirectory(null);
                }}
              >
                {tr(c.title, locale)}
                <I name="ArrowRight" size={16} />
              </button>
            ))}
          </div>
        </Modal>
      ) : null}
      {workspace ? (
        <Modal
          title={tr(p.action, locale)}
          locale={locale}
          onClose={() => setWorkspace(false)}
        >
          <p>
            {family === "printables"
              ? text("downloadsNote", locale)
              : tr(p.body, locale)}
          </p>
          <h3>{text("choose", locale)}</h3>
          {rows.length && !error ? (
            <div className={s.workspaceChoices}>
              {rows.map((r) => (
                <Link key={r.key} href={workspaceHref(r, locale)}>
                  {r.image ? (
                    <img src={r.image} alt="" width={64} height={64} />
                  ) : (
                    <Art index={nativeArt[family][0]} />
                  )}
                  <span>
                    <strong>{r.title}</strong>
                    <small>
                      {r.facts.formats.join(" · ") || text("open", locale)}
                    </small>
                  </span>
                  <I name="ArrowRight" size={17} />
                </Link>
              ))}
            </div>
          ) : (
            <p>{text("noPublished", locale)}</p>
          )}
          <a
            className={s.primary}
            href="#discover"
            onClick={() => setWorkspace(false)}
          >
            {text("viewAll", locale)}
            <I name="ArrowRight" size={16} />
          </a>
        </Modal>
      ) : null}
      {share ? (
        <Modal
          title={text("share", locale)}
          locale={locale}
          onClose={() => setShare(null)}
        >
          <p role="status">
            {text(share.copied ? "copied" : "copyError", locale)}
          </p>
          <input
            className={s.shareLink}
            readOnly
            value={share.url}
            aria-label={text("share", locale)}
            onFocus={(e) => e.target.select()}
          />
        </Modal>
      ) : null}
    </div>
  );
}
function QuickPreview({
  item,
  locale,
  onClose,
  onShare,
}: {
  item: ReferenceItem;
  locale: Locale;
  onClose: () => void;
  onShare: () => void;
}) {
  const guest = useGuest(),
    [result, setResult] = useState<{
      item: ReferenceItem;
      images: { url: string; alt: string }[];
    } | null>(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0),
    [index, setIndex] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setError(false);
    fetch(
      "/api/kidflix/preview?" + new URLSearchParams({ locale, key: item.key }),
      {
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(30000),
        ]),
      },
    )
      .then(async (r) => {
        if (!r.ok) throw Error();
        const v = await r.json();
        if (!v?.item || !Array.isArray(v.images)) throw Error();
        if (active) setResult(v);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [item.key, locale, retry]);
  const r = result?.item || item,
    image = result?.images[index],
    href = detailHref(r, locale),
    saved = guest.saved.includes(r.key);
  return (
    <Modal title={r.title} locale={locale} onClose={onClose}>
      {error ? (
        <div role="alert">
          <p>{text("error", locale)}</p>
          <button
            className={s.secondary}
            onClick={() => setRetry((n) => n + 1)}
          >
            {text("retry", locale)}
          </button>
        </div>
      ) : !result ? (
        <p role="status">{text("loading", locale)}</p>
      ) : null}
      <div className={s.quickPreview}>
        <div>
          {image ? (
            <img src={image.url} alt={image.alt} width={640} height={480} />
          ) : r.image ? (
            <img src={r.image} alt={r.imageAlt} width={640} height={480} />
          ) : (
            <p>{text("noPreview", locale)}</p>
          )}
          {result && result.images.length > 1 ? (
            <div className={s.thumbnails}>
              {result.images.map((v, i) => (
                <button
                  key={v.url}
                  aria-pressed={i === index}
                  aria-label={text("preview", locale) + " " + (i + 1)}
                  onClick={() => setIndex(i)}
                >
                  <img src={v.url} alt="" width={70} height={60} />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p>{r.summary}</p>
          <ResourceFacts item={r} locale={locale} />
          <div className={s.modalActions}>
            <Link
              className={s.primary}
              href={href}
              onClick={() => guest.visit(r.key)}
            >
              {text("open", locale)}
              <I name="ArrowRight" size={16} />
            </Link>
            <button
              className={s.secondary}
              aria-pressed={saved}
              onClick={() => guest.toggle(r.key)}
            >
              <I name="Bookmark" size={16} />
              {text(saved ? "saved" : "save", locale)}
            </button>
            <button className={s.secondary} onClick={onShare}>
              <I name="Share2" size={16} />
              {text("share", locale)}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ResourceFacts({
  item,
  locale,
}: {
  item: ReferenceItem;
  locale: Locale;
}) {
  const count = primaryCount(item);
  return (
    <div className={s.referenceFacts}>
      {count ? (
        <span>
          {count.value} {tr(count.label, locale)}
        </span>
      ) : null}
      {item.ageMin !== null && item.ageMax !== null ? (
        <span>
          {item.ageMin}–{item.ageMax} {tr(["years", "ans", "سنوات"], locale)}
        </span>
      ) : null}
      {item.duration !== null ? (
        <span>
          {item.duration} {tr(["minutes", "minutes", "دقائق"], locale)}
        </span>
      ) : null}
      {item.facts.formats.map((f) => (
        <span key={f}>{f}</span>
      ))}
      {(
        [
          "narration",
          "captions",
          "transcript",
          "editable",
          "certificate",
        ] as const
      )
        .filter((key) => item.facts[key])
        .map((key) => (
          <span key={key}>
            {tr(
              (
                {
                  narration: ["Narration", "Narration", "سرد"],
                  captions: ["Captions", "Sous-titres", "ترجمة"],
                  transcript: ["Transcript", "Transcription", "نص مكتوب"],
                  editable: ["Editable", "Modifiable", "قابل للتعديل"],
                  certificate: [
                    "Certificate available",
                    "Certificat disponible",
                    "شهادة متاحة",
                  ],
                } as Record<string, Tri>
              )[key],
              locale,
            )}
          </span>
        ))}
    </div>
  );
}
