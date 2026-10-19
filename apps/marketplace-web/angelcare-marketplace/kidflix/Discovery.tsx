"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  path,
  tr,
  world,
  emptyCatalogue,
  type Locale,
  type Resource,
  type Catalogue,
  type World,
  WORLDS,
} from "./catalogue";
import { copy } from "./copy";
import { useGuest } from "./continuity";
import { I } from "./Icons";
import s from "./kidflix.module.css";
export const ageText = (r: Resource, l: Locale) =>
  r.ageMin !== null && r.ageMax !== null
    ? `${r.ageMin}–${r.ageMax} ${copy("years", l)}`
    : "";
export function ResourceCard({
  resource: r,
  locale,
  large = false,
}: {
  resource: Resource;
  locale: Locale;
  large?: boolean;
}) {
  const w = world(r.family)!,
    guest = useGuest(),
    saved = guest.saved.includes(r.key);
  return (
    <article
      className={`${s.resourceCard} ${large ? s.largeCard : ""}`}
      style={{ "--accent": w.color, "--tint": w.tint } as React.CSSProperties}
    >
      <div className={s.cardMedia}>
        <Link href={path(locale, "/experience/" + r.key)} aria-label={r.title}>
          {r.image ? (
            <img
              src={r.image}
              alt={r.imageAlt}
              loading="lazy"
              width={440}
              height={300}
            />
          ) : (
            <div className={s.noCover}>
              <I name={w.icon} size={50} />
              <span>{tr(w.short, locale)}</span>
            </div>
          )}
          <span className={s.mediaGradient} />
        </Link>
        <span className={s.cardFamily}>
          <I name={w.icon} size={13} />
          {tr(w.short, locale)}
        </span>
        <button
          className={s.heart}
          onClick={() => guest.toggle(r.key)}
          aria-pressed={saved}
          aria-label={copy(saved ? "unsave" : "save", locale)}
        >
          <I name={saved ? "Bookmark" : "Heart"} size={17} />
        </button>
        {r.formats.length ? (
          <div className={s.formats}>
            {r.formats.slice(0, 3).map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
        ) : null}
      </div>
      <div className={s.cardBody}>
        <Link
          href={path(locale, "/experience/" + r.key)}
          className={s.cardTitle}
        >
          {r.title}
        </Link>
        {large && r.summary ? <p>{r.summary}</p> : null}
        <div className={s.cardFacts}>
          {ageText(r, locale) ? (
            <span>{ageText(r, locale)}</span>
          ) : r.subject ? (
            <span>{r.subject}</span>
          ) : (
            <span>{copy("free", locale)}</span>
          )}
          {r.duration && r.duration > 0 ? (
            <span>
              <I name="Clock" size={12} />
              {r.duration} {copy("mins", locale)}
            </span>
          ) : null}
          <Link
            className={s.cardArrow}
            href={path(locale, "/experience/" + r.key)}
            aria-label={`${copy("open", locale)} · ${r.title}`}
          >
            <I name="ArrowRight" size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function WorldCard({
  w,
  locale,
  image,
  count,
}: {
  w: World;
  locale: Locale;
  image?: string;
  count?: number;
}) {
  return (
    <Link
      className={s.worldCard}
      href={path(locale, "/explore/" + w.key)}
      style={{ "--accent": w.color, "--tint": w.tint } as React.CSSProperties}
    >
      <div className={s.worldImage}>
        <img
          src={image || w.image}
          alt=""
          width={260}
          height={160}
          loading="lazy"
        />
        <span>
          <I name={w.icon} size={21} />
        </span>
      </div>
      <div className={s.worldCardText}>
        <h3>{tr(w.title, locale)}</h3>
        <p>{tr(w.description, locale)}</p>
        <div>
          {typeof count === "number" && count > 0 ? (
            <small>
              {count} {copy("results", locale)}
            </small>
          ) : (
            <small>{tr(w.short, locale)}</small>
          )}
          <span>
            <I name="ArrowRight" size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
export function SectionTitle({
  title,
  sub,
  icon = "Sparkles",
  href,
  locale,
  accent = "#1267cf",
  tag,
}: {
  title: string;
  sub?: string;
  icon?: string;
  href?: string;
  locale: Locale;
  accent?: string;
  tag?: string;
}) {
  return (
    <div
      className={s.sectionTitle}
      style={{ "--accent": accent } as React.CSSProperties}
    >
      <div className={s.titleIcon}>
        <I name={icon} size={25} />
      </div>
      <div className={s.sectionHeading}>
        <div>
          <h2>{title}</h2>
          {tag ? <span className={s.freeTag}>{tag}</span> : null}
        </div>
        {sub ? <p>{sub}</p> : null}
      </div>
      {href ? (
        <Link href={href}>
          {copy("all", locale)}
          <I name="ArrowRight" size={16} />
        </Link>
      ) : null}
    </div>
  );
}
export function Shelf({ rows, locale }: { rows: Resource[]; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className={s.shelfWrap}>
      <div
        className={s.shelf}
        ref={ref}
        style={
          {
            "--shelf-columns": Math.max(3, Math.min(6, rows.length)),
          } as React.CSSProperties
        }
      >
        {rows.map((r) => (
          <ResourceCard key={r.id} resource={r} locale={locale} />
        ))}
      </div>
      {rows.length > 4 ? (
        <div className={s.shelfControls}>
          <button
            aria-label={copy("previous", locale)}
            onClick={() =>
              ref.current?.scrollBy({
                left:
                  (locale === "ar" ? 1 : -1) * (ref.current.clientWidth * 0.8),
                behavior: "smooth",
              })
            }
          >
            <I name="ChevronLeft" size={17} />
          </button>
          <button
            aria-label={copy("next", locale)}
            onClick={() =>
              ref.current?.scrollBy({
                left:
                  (locale === "ar" ? -1 : 1) * (ref.current.clientWidth * 0.8),
                behavior: "smooth",
              })
            }
          >
            <I name="ChevronRight" size={17} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
export function ReadFailure({ locale }: { locale: Locale }) {
  return (
    <div role="alert" className={s.readError}>
      <I name="RotateCcw" />
      <p>{copy("error", locale)}</p>
      <button className={s.outline} onClick={() => location.reload()}>
        {copy("retry", locale)}
      </button>
    </div>
  );
}
export function useCatalogue(
  locale: Locale,
  params: Record<string, string>,
  initial: Catalogue = emptyCatalogue,
  skip = false,
) {
  const [data, set] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(initial.error || false),
    [retry, setRetry] = useState(0),
    key = JSON.stringify(params);
  useEffect(() => {
    if (skip) return;
    const controller = new AbortController();
    setBusy(true);
    setError(false);
    fetch(
      "/api/kidflix/discovery?" +
        new URLSearchParams({ locale, ...JSON.parse(key) }),
      { signal: controller.signal },
    )
      .then(async (r) => {
        if (!r.ok) throw Error("Read failed");
        const value = await r.json();
        if (!Array.isArray(value.rows)) throw Error("Invalid response");
        set(value);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [locale, key, retry, skip]);
  return { data, busy, error, reload: () => setRetry((v) => v + 1) };
}
export function SavedDiscoveries({
  locale,
  recent = false,
  compact = false,
}: {
  locale: Locale;
  recent?: boolean;
  compact?: boolean;
}) {
  const guest = useGuest(),
    keys = recent ? guest.recent : guest.saved,
    q = useCatalogue(
      locale,
      { keys: keys.join(","), page: "1" },
      emptyCatalogue,
      !guest.ready || !keys.length,
    );
  if (compact && (!guest.ready || !keys.length)) return null;
  return (
    <section className={s.section}>
      <SectionTitle
        title={copy(recent ? "continue" : "saved", locale)}
        sub={copy("stored", locale)}
        icon={recent ? "Clock" : "Heart"}
        locale={locale}
        href={compact ? path(locale, "/saved") : undefined}
      />
      {q.busy ? (
        <div className={s.readLoading} role="status">
          {copy("loading", locale)}
        </div>
      ) : q.error ? (
        <ReadFailure locale={locale} />
      ) : q.data.rows.length && keys.length ? (
        <Shelf rows={q.data.rows} locale={locale} />
      ) : (
        <div className={s.empty}>
          <I name="Heart" size={35} />
          <h2>{copy("noneSaved", locale)}</h2>
          <p>{copy("emptySub", locale)}</p>
          <Link className={s.primary} href={path(locale, "/explore")}>
            {copy("explore", locale)}
            <I name="ArrowRight" size={17} />
          </Link>
        </div>
      )}
    </section>
  );
}
const AUDIENCES = [
  ["child", ["Children", "Enfants", "الأطفال"]],
  ["parent", ["Parents", "Parents", "الآباء"]],
  ["educator", ["Educators", "Éducateurs", "المربّون"]],
  ["professional", ["Professionals", "Professionnels", "المتخصصون"]],
  ["school", ["Schools", "Écoles", "المدارس"]],
] as const;
export function Explorer({
  locale,
  family,
  initial,
  initialFilters = {},
}: {
  locale: Locale;
  family?: string;
  initial: Catalogue;
  initialFilters?: Record<string, string>;
}) {
  const w = world(family || ""),
    [values, setValues] = useState<Record<string, string>>({
      ...initialFilters,
      ...(family ? { family } : {}),
      page: initialFilters.page || "1",
    }),
    [query, setQuery] = useState(values.q || ""),
    [filterOpen, setFilterOpen] = useState(false),
    q = useCatalogue(locale, values, initial);
  useEffect(() => {
    const t = setTimeout(
      () =>
        setValues((v) => (v.q === query ? v : { ...v, q: query, page: "1" })),
      350,
    );
    return () => clearTimeout(t);
  }, [query]);
  const update = (key: string, value: string) =>
    setValues((v) => ({ ...v, [key]: value, page: "1" }));
  useEffect(() => {
    const url = new URL(location.href);
    url.search = "";
    Object.entries(values).forEach(([k, v]) => {
      if (v && k !== "family") url.searchParams.set(k, v);
    });
    history.replaceState(null, "", url);
  }, [values]);
  const options = [
    [
      "family",
      copy("worlds", locale),
      WORLDS.map((w) => [w.key, tr(w.title, locale)]),
    ],
    ["subject", copy("subject", locale), q.data.subjects.map((s) => [s, s])],
    ["skill", copy("skill", locale), q.data.skills.map((s) => [s, s])],
    [
      "age",
      copy("age", locale),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16].map((n) => [
        String(n),
        `${n} ${copy("years", locale)}`,
      ]),
    ],
    [
      "format",
      copy("format", locale),
      ["PDF", "PNG", "MP3", "MP4", "HTML"].map((f) => [f, f]),
    ],
    [
      "audience",
      copy("audience", locale),
      AUDIENCES.map(([k, t]) => [k, tr(t, locale)]),
    ],
    [
      "duration",
      copy("duration", locale),
      [5, 10, 15, 30, 60].map((n) => [
        String(n),
        `≤ ${n} ${copy("mins", locale)}`,
      ]),
    ],
    [
      "difficulty",
      copy("difficulty", locale),
      [
        [
          "introductory",
          tr(
            ["First discoveries", "Premières découvertes", "الاكتشافات الأولى"],
            locale,
          ),
        ],
        [
          "developing",
          tr(["Growing confidence", "En progression", "ثقة متنامية"], locale),
        ],
        [
          "confident",
          tr(["Confident explorer", "À l’aise", "مستكشف واثق"], locale),
        ],
        [
          "advanced",
          tr(
            ["Further discovery", "Pour aller plus loin", "اكتشاف متقدم"],
            locale,
          ),
        ],
      ],
    ],
  ] as [string, string, string[][]][];
  return (
    <>
      <section
        className={s.explorerHero}
        style={
          {
            "--accent": w?.color || "#1569d0",
            "--tint": w?.tint || "#eef6ff",
          } as React.CSSProperties
        }
      >
        <div>
          <Link href={path(locale)} className={s.breadcrumb}>
            <I name="ArrowLeft" size={14} />
            {copy("home", locale)}
          </Link>
          <div className={s.eyebrow}>
            <I name={w?.icon || "Compass"} size={17} />
            {copy("free", locale)}
          </div>
          <h1>{w ? tr(w.title, locale) : copy("explore", locale)}</h1>
          <p>{w ? tr(w.invitation, locale) : copy("worldSub", locale)}</p>
        </div>
        {w ? (
          <img src={w.image} alt="" width={560} height={300} />
        ) : (
          <div className={s.explorerOrbits} aria-hidden="true">
            {WORLDS.slice(0, 6).map((w) => (
              <span key={w.key} style={{ color: w.color, background: w.tint }}>
                <I name={w.icon} size={30} />
              </span>
            ))}
          </div>
        )}
      </section>
      <section className={s.section}>
        <div className={s.explorerSearch}>
          <div className={s.search}>
            <I name="Search" />
            <input
              type="search"
              aria-label={copy("searchShort", locale)}
              placeholder={copy("search", locale)}
              maxLength={100}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className={s.outline}
            aria-expanded={filterOpen}
            aria-controls="kidflix-filters"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <I name="SlidersHorizontal" size={17} />
            {copy("filters", locale)}
          </button>
          <label className={s.sort}>
            <span className={s.sr}>
              {tr(["Sort", "Trier", "ترتيب"], locale)}
            </span>
            <select
              value={values.sort || "new"}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="new">{copy("newest", locale)}</option>
              <option value="title">{copy("titleSort", locale)}</option>
            </select>
          </label>
        </div>
        {filterOpen ? (
          <div className={s.filters} id="kidflix-filters">
            {options
              .filter(([k]) => !(family && k === "family"))
              .map(([key, label, choices]) => (
                <label key={key}>
                  <span>{label}</span>
                  <select
                    aria-label={label}
                    value={values[key] || ""}
                    onChange={(e) => update(key, e.target.value)}
                  >
                    <option value="">{copy("all", locale)}</option>
                    {choices.map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            <button
              className={s.textButton}
              onClick={() => {
                setQuery("");
                setValues({ ...(family ? { family } : {}), page: "1" });
              }}
            >
              {copy("clear", locale)}
              <I name="X" size={14} />
            </button>
          </div>
        ) : null}
        <div aria-live="polite" className={s.resultCount}>
          {q.busy
            ? copy("loading", locale)
            : `${q.data.total} ${copy("results", locale)}`}
          {Object.entries(values)
            .filter(([k, v]) => v && !["page", "sort", "family"].includes(k))
            .map(([k, v]) => (
              <button
                key={k}
                onClick={() => {
                  update(k, "");
                  if (k === "q") setQuery("");
                }}
              >
                {v}
                <I name="X" size={12} />
              </button>
            ))}
        </div>
        {q.error ? (
          <ReadFailure locale={locale} />
        ) : (
          <div aria-busy={q.busy} className={q.busy ? s.refreshing : undefined}>
            {q.data.rows.length ? (
              <div className={s.resourceGrid}>
                {q.data.rows.map((r) => (
                  <ResourceCard key={r.id} resource={r} locale={locale} />
                ))}
              </div>
            ) : !q.busy ? (
              <div className={s.empty}>
                <I name={w?.icon || "Compass"} size={45} />
                <h2>{copy("empty", locale)}</h2>
                <p>{copy("emptySub", locale)}</p>
                <Link className={s.primary} href={path(locale)}>
                  {copy("back", locale)}
                  <I name="ArrowRight" size={17} />
                </Link>
              </div>
            ) : (
              <div className={s.skeletonGrid}>
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} />
                ))}
              </div>
            )}
          </div>
        )}
        {q.data.total > 24 ? (
          <nav
            className={s.pagination}
            aria-label={tr(
              ["Result pages", "Pages de résultats", "صفحات النتائج"],
              locale,
            )}
          >
            <button
              className={s.outline}
              disabled={q.busy || Number(values.page) <= 1}
              onClick={() =>
                setValues((v) => ({ ...v, page: String(Number(v.page) - 1) }))
              }
            >
              <I name="ChevronLeft" />
              {copy("previous", locale)}
            </button>
            <span>
              {values.page} / {Math.ceil(q.data.total / 24)}
            </span>
            <button
              className={s.outline}
              disabled={q.busy || Number(values.page) * 24 >= q.data.total}
              onClick={() =>
                setValues((v) => ({ ...v, page: String(Number(v.page) + 1) }))
              }
            >
              {copy("next", locale)}
              <I name="ChevronRight" />
            </button>
          </nav>
        ) : null}
      </section>
      <section className={s.section}>
        <SectionTitle
          title={copy("related", locale)}
          sub={copy("worldSub", locale)}
          icon="Compass"
          locale={locale}
        />
        <div className={s.worldGrid}>
          {WORLDS.filter((x) => x.key !== family)
            .slice(0, 8)
            .map((w) => (
              <WorldCard key={w.key} w={w} locale={locale} />
            ))}
        </div>
      </section>
    </>
  );
}
