"use client";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Copy,
  Layers3,
  Search,
  Sparkles,
} from "lucide-react";
import type {
  CatalogLocale,
  DiscoveryItem,
  StorefrontExperience,
} from "../catalog-discovery/types";
import type { NativeContext } from "../storefront-immersive/native-context";
import {
  canonicalItems,
  filterItems,
  INITIAL_FILTERS,
  itemHref,
  priceLabel,
  safeHref,
} from "../storefront-immersive/contract";
import { OfferCard } from "../storefront-immersive/ExperienceUI";
import { useSelections } from "../storefront-immersive/useSelections";
import type { Words } from "../storefront-immersive/content";
import {
  B,
  WORLDS,
  photo,
  tr,
  type BusinessKey,
  type Dossier,
} from "./content";
import { prioritySummary, publicEvent, routeFor } from "./contract";
import { Enquiry } from "./Enquiry";
import { storefrontPhoto } from "../storefront-immersive/editorial-media";
import s from "./business.module.css";
interface WorldState {
  world: BusinessKey;
  locale: CatalogLocale;
  experience: StorefrontExperience;
  native: NativeContext;
  selected: number[];
  select: (i: number) => void;
  context: Record<string, string>;
  setContext: (dimension: string, label: string) => void;
  brief: string;
}
const Context = createContext<WorldState | null>(null);
export function useWorld() {
  const value = useContext(Context);
  if (!value) throw Error("Business world context missing");
  return value;
}
export function WorldFrame({
  world,
  experience,
  native,
  children,
  builtinWorldId,
}: {
  world: BusinessKey;
  experience: StorefrontExperience;
  native: NativeContext;
  children: ReactNode;
  builtinWorldId?: string | null;
}) {
  const locale = experience.locale,
    [selected, setSelected] = useState<number[]>([]),
    [context, setContextValues] = useState<Record<string, string>>({}),
    [motion, setMotion] = useState(true),
    [dockVisible, setDockVisible] = useState(false),
    root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opening = root.current?.querySelector("section"),
      enquiry = root.current?.querySelector("#world-enquiry");
    if (!opening || typeof IntersectionObserver === "undefined") return;
    const visible = { opening: true, enquiry: false };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === opening) visible.opening = entry.isIntersecting;
          if (entry.target === enquiry) visible.enquiry = entry.isIntersecting;
        }
        setDockVisible(!visible.opening && !visible.enquiry);
      },
      { rootMargin: "-180px 0px 0px 0px" },
    );
    observer.observe(opening);
    if (enquiry) observer.observe(enquiry);
    return () => observer.disconnect();
  }, []);
  const select = (i: number) => {
    setSelected((prior) =>
      prior.includes(i) ? prior.filter((v) => v !== i) : [...prior, i],
    );
    void publicEvent(world, locale, "explorer_change", { choice: i });
  };
  const setContext = (dimension: string, label: string) => {
    setContextValues((prior) => ({ ...prior, [dimension]: label }));
    void publicEvent(world, locale, "explorer_change", {
      dimension,
      choice: label.slice(0, 80),
    });
  };
  const brief = prioritySummary(
    world,
    locale,
    selected,
    Object.values(context),
  );
  return (
    <Context.Provider
      value={{
        world,
        locale,
        experience,
        native,
        selected,
        select,
        context,
        setContext,
        brief,
      }}
    >
      <div
        ref={root}
        className={`${s.world} ${s[world.replace("-", "_")] || ""}`}
        data-business-world={world}
        data-business-revision="R2"
        data-motion={motion ? "on" : "off"}
        data-ac-builtin-world={builtinWorldId || undefined}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {children}
        <div className={s.bottomDock} data-visible={dockVisible}>
          <a href="#world-enquiry">
            {tr(WORLDS[world].action, locale)}
            <ArrowUpRight size={15} />
          </a>
          <a href="#world-offers">
            {tr(B.offers, locale)}
            <ArrowDown size={15} />
          </a>
          <button
            type="button"
            aria-pressed={!motion}
            onClick={() => setMotion(!motion)}
          >
            {locale === "fr"
              ? "Animations"
              : locale === "ar"
                ? "الحركة"
                : "Motion"}{" "}
            {motion ? "●" : "○"}
          </button>
        </div>
      </div>
    </Context.Provider>
  );
}
export function Picture({
  name,
  alt = "",
  priority = false,
  className = "",
}: {
  name: string;
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const world = useContext(Context)?.world;
  return (
    <div className={`${s.picture} ${className}`} data-editorial-image={name}>
      {!failed ? (
        <img
          src={world ? storefrontPhoto(world, name) : photo(name)}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{alt || "ANGELCARE"}</span>
      )}
    </div>
  );
}
export function LinkButton({
  href = "#world-enquiry",
  children,
  soft = false,
}: {
  href?: string;
  children?: ReactNode;
  soft?: boolean;
}) {
  const { locale, world } = useWorld();
  return (
    <Link className={soft ? s.softButton : s.button} href={href}>
      {children || tr(WORLDS[world].action, locale)}
      <ArrowUpRight size={18} />
    </Link>
  );
}
export function Section({
  id,
  kicker,
  title,
  lead,
  children,
  tone = "",
  className = "",
}: {
  id: string;
  kicker?: Words;
  title: Words;
  lead?: Words;
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  const { locale } = useWorld();
  return (
    <section
      className={`${s.section} ${s[tone] || ""} ${className}`}
      id={id}
      data-business-module={id}
    >
      <header className={s.head}>
        {kicker ? (
          <span className={s.kicker}>
            <Sparkles size={15} />
            {tr(kicker, locale)}
          </span>
        ) : null}
        <h2>{tr(title, locale)}</h2>
        {lead ? <p>{tr(lead, locale)}</p> : null}
      </header>
      {children}
    </section>
  );
}
export function WorldNav({
  entries,
}: {
  entries: { id: string; label: Words }[];
}) {
  const { locale, world } = useWorld();
  return (
    <nav className={s.worldNav} aria-label={tr(WORLDS[world].label, locale)}>
      <span>{tr(WORLDS[world].label, locale)}</span>
      {entries.map((e) => (
        <a key={e.id} href={`#${e.id}`}>
          {tr(e.label, locale)}
        </a>
      ))}
      <a href="#world-offers">{tr(B.offers, locale)}</a>
      <a href="#world-enquiry">{tr(B.prepare, locale)}</a>
    </nav>
  );
}
export function Priorities() {
  const { locale, world, selected, select } = useWorld();
  return (
    <div className={s.priorities}>
      {WORLDS[world].priorities.map((label, i) => (
        <button
          key={label.en}
          type="button"
          aria-pressed={selected.includes(i)}
          onClick={() => select(i)}
        >
          <span>{String(i + 1).padStart(2, "0")}</span>
          {tr(label, locale)}
          {selected.includes(i) ? <Check size={18} /> : <span>+</span>}
        </button>
      ))}
    </div>
  );
}
export function Dossiers({
  layout = "tiles",
  items,
}: {
  layout?: "tiles" | "strips" | "overlap" | "portfolio";
  items?: Dossier[];
}) {
  const { world, locale } = useWorld();
  return (
    <div className={`${s.dossiers} ${s[layout]}`}>
      {(items || WORLDS[world].dossiers).map((d, i) => (
        <article key={d.title.en}>
          <Picture name={d.photo} alt={tr(d.title, locale)} />
          <div>
            <span className={s.kicker}>
              {String(i + 1).padStart(2, "0")} / ANGELCARE
            </span>
            <h3>{tr(d.title, locale)}</h3>
            <p>{tr(d.body, locale)}</p>
            <details>
              <summary>{tr(B.details, locale)}</summary>
              <p>{tr(d.detail, locale)}</p>
            </details>
            {d.href ? (
              <Link className={s.textButton} href={routeFor(locale, d.href)}>
                {tr(B.discover, locale)}
                <ArrowUpRight size={16} />
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
export interface Step {
  title: Words;
  body: Words;
}
export function Steps({
  steps,
  vertical = false,
}: {
  steps: Step[];
  vertical?: boolean;
}) {
  const { locale } = useWorld();
  return (
    <ol className={vertical ? s.verticalSteps : s.steps}>
      {steps.map((step, i) => (
        <li key={step.title.en}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3>{tr(step.title, locale)}</h3>
            <p>{tr(step.body, locale)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
export function Tiles({
  items,
}: {
  items: { title: Words; body: Words; photo?: string }[];
}) {
  const { locale } = useWorld();
  return (
    <div className={s.tiles}>
      {items.map((t, i) => (
        <article key={t.title.en}>
          {t.photo ? (
            <Picture name={t.photo} alt={tr(t.title, locale)} />
          ) : (
            <span className={s.tileOrdinal}>
              {String(i + 1).padStart(2, "0")}
            </span>
          )}
          <h3>{tr(t.title, locale)}</h3>
          <p>{tr(t.body, locale)}</p>
        </article>
      ))}
    </div>
  );
}
export function Brief() {
  const { locale, brief, world, selected } = useWorld(),
    [copied, setCopied] = useState<"yes" | "no" | null>(null);
  return (
    <div className={s.briefPanel} data-business-tool="brief">
      <div>
        <span className={s.kicker}>
          <Layers3 size={16} />
          {tr(B.summary, locale)}
        </span>
        <h3>{tr(WORLDS[world].action, locale)}</h3>
        <p data-brief-text>{brief}</p>
        <small>
          {locale === "fr"
            ? "Cette préparation exprime vos choix ; le périmètre final sera précisé dans votre demande."
            : locale === "ar"
              ? "يعبر التحضير عن اختياراتكم ويُوضح النطاق النهائي أثناء الطلب."
              : "This preparation expresses your choices; the final scope will be clarified through your enquiry."}
        </small>
      </div>
      <div className={s.briefActions}>
        <LinkButton />
        <button
          type="button"
          className={s.softButton}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(brief);
              setCopied("yes");
              void publicEvent(world, locale, "brief_prepared", {
                count: selected.length,
              });
            } catch {
              setCopied("no");
            }
          }}
        >
          <Copy size={15} />
          {tr(B.copy, locale)}
        </button>
        {copied ? (
          <p role="status">
            {tr(copied === "yes" ? B.copied : B.copyError, locale)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
export function Catalogue() {
  const { experience, locale, world } = useWorld(),
    items = useMemo(() => canonicalItems(experience), [experience]),
    selections = useSelections(experience, items);
  const [q, setQ] = useState(""),
    [kind, setKind] = useState("all"),
    [sort, setSort] = useState<"recommended" | "name" | "price_asc">(
      "recommended",
    ),
    [limit, setLimit] = useState(8),
    [view, setView] = useState<"all" | "saved" | "compare">("all");
  const filtered = filterItems(items, {
      ...INITIAL_FILTERS,
      query: q,
      kind,
      sort,
    }),
    shown = filtered.filter(
      (item) =>
        view === "all" ||
        (view === "saved" ? selections.saved : selections.compared).includes(
          item.id,
        ),
    ),
    kinds = [...new Set(items.map((i) => i.kind))];
  const kindName = (k: string) =>
    (({
      product: { fr: "Produits", en: "Products", ar: "منتجات" },
      service: { fr: "Services", en: "Services", ar: "خدمات" },
      training: { fr: "Formations", en: "Training", ar: "تكوين" },
      audit: { fr: "Évaluations", en: "Evaluations", ar: "تقييمات" },
      saas_module: { fr: "Modules", en: "Modules", ar: "وحدات" },
      kit: { fr: "Kits", en: "Kits", ar: "مجموعات" },
    })[k] || B.all)[locale];
  const change = () => setLimit(8);
  return (
    <Section
      id="world-offers"
      kicker={B.published}
      title={B.offers}
      lead={B.offersLead}
      tone="catalogue"
    >
      <div className={s.catalogueTop}>
        <span className={s.liveCount}>
          {items.length} {tr(B.published, locale)}
        </span>
        <Link
          className={s.textButton}
          href={routeFor(locale, `marketplace/search?category=${world}`)}
        >
          {tr(B.discover, locale)}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      {items.length ? (
        <>
          <div className={s.filters}>
            <label>
              <span>{tr(B.search, locale)}</span>
              <div>
                <Search size={17} />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    change();
                  }}
                />
              </div>
            </label>
            <label>
              <span>{tr(B.kind, locale)}</span>
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  change();
                }}
              >
                <option value="all">{tr(B.all, locale)}</option>
                {kinds.map((k) => (
                  <option key={k} value={k}>
                    {kindName(k)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{tr(B.sort, locale)}</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as typeof sort);
                  change();
                }}
              >
                <option value="recommended">{tr(B.all, locale)}</option>
                <option value="name">{tr(B.name, locale)}</option>
                <option value="price_asc">{tr(B.price, locale)}</option>
              </select>
            </label>
            <button
              className={s.textButton}
              type="button"
              onClick={() => {
                setQ("");
                setKind("all");
                setSort("recommended");
                setView("all");
                change();
              }}
            >
              {tr(B.reset, locale)}
            </button>
          </div>
          <div className={s.selectionTabs}>
            {(["all", "saved", "compare"] as const).map((key) => (
              <button
                type="button"
                key={key}
                aria-pressed={view === key}
                onClick={() => {
                  setView(key);
                  change();
                }}
              >
                {tr(B[key], locale)}
                {key === "all"
                  ? ` (${items.length})`
                  : ` (${(key === "saved" ? selections.saved : selections.compared).length})`}
              </button>
            ))}
          </div>
          {selections.error ? (
            <p role="alert" className={s.error}>
              {selections.error === "limit"
                ? locale === "fr"
                  ? "Comparez jusqu’à quatre offres."
                  : locale === "ar"
                    ? "يمكن مقارنة أربعة عروض."
                    : "Compare up to four offers."
                : locale === "fr"
                  ? "La sélection n’a pas pu être confirmée. Réessayez."
                  : locale === "ar"
                    ? "تعذر تأكيد الاختيار. أعيدوا المحاولة."
                    : "Selection could not be confirmed. Try again."}
            </p>
          ) : null}
          {view === "compare" && shown.length ? (
            <div className={s.compareTable}>
              <table>
                <caption>{tr(B.compare, locale)}</caption>
                <thead>
                  <tr>
                    <th>{tr(B.name, locale)}</th>
                    <th>{tr(B.kind, locale)}</th>
                    <th>{tr(B.price, locale)}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link href={itemHref(item, locale)}>{item.name}</Link>
                      </td>
                      <td>{kindName(item.kind)}</td>
                      <td>{priceLabel(item, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className={s.offers}>
            {shown.slice(0, limit).map((item) => (
              <OfferCard
                key={item.id}
                item={item}
                locale={locale}
                selections={selections}
              />
            ))}
          </div>
          {!shown.length ? (
            <div className={s.empty}>
              <p>{tr(B.noMatch, locale)}</p>
              <button
                type="button"
                className={s.softButton}
                onClick={() => {
                  setQ("");
                  setKind("all");
                  setView("all");
                  change();
                }}
              >
                {tr(B.reset, locale)}
              </button>
            </div>
          ) : null}
          {shown.length > limit ? (
            <button
              className={s.button}
              type="button"
              onClick={() => setLimit((n) => n + 8)}
            >
              {tr(B.more, locale)} ({shown.length - limit})
            </button>
          ) : null}
        </>
      ) : (
        <div className={s.empty}>
          <Sparkles size={30} />
          <p>{tr(B.emptyOffers, locale)}</p>
          <LinkButton />
        </div>
      )}
    </Section>
  );
}
export function Published() {
  const { native, locale, world } = useWorld();
  const resources = native.resources.filter((r) => safeHref(r.href, "")),
    editorial = native.editorial.filter((e) => e.title || e.body);
  if (!resources.length && !editorial.length) return null;
  return (
    <Section id="world-resources" title={B.resources} tone="paper">
      <div className={s.resources}>
        {resources.map((r) => (
          <article key={r.id}>
            <span className={s.kicker}>
              {r.kind === "plan" ? "PARTNER OS" : "ANGELCARE"}
            </span>
            <h3>{r.title}</h3>
            <p>{r.body}</p>
            {r.amount != null ? (
              <strong>
                {`${new Intl.NumberFormat(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-GB").format(r.amount)} ${r.currency || ""}`}
                {r.period
                  ? ` / ${r.period === "monthly" ? (locale === "fr" ? "mois" : locale === "ar" ? "شهر" : "month") : r.period === "annual" ? (locale === "fr" ? "an" : locale === "ar" ? "سنة" : "year") : r.period === "quarterly" ? (locale === "fr" ? "trimestre" : locale === "ar" ? "فصل" : "quarter") : locale === "fr" ? "période définie" : locale === "ar" ? "فترة محددة" : "defined period"}`
                  : ""}
              </strong>
            ) : null}
            <ul>
              {r.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {r.sourceLocale !== locale ? (
              <small>
                {locale === "ar"
                  ? "المحتوى المنشور بالفرنسية"
                  : "Published content in French"}
              </small>
            ) : null}
            <Link
              className={s.textButton}
              href={safeHref(r.href, "#world-enquiry")}
            >
              {tr(B.details, locale)}
              <ArrowUpRight size={16} />
            </Link>
          </article>
        ))}
        {editorial.map((e) => (
          <article key={e.id}>
            {e.media ? (
              <div className={s.publicMedia}>
                <img src={e.media} alt="" loading="lazy" />
              </div>
            ) : null}
            <span>{e.eyebrow}</span>
            <h3>{e.title}</h3>
            <p>{e.body}</p>
            {e.href ? (
              <Link
                className={s.textButton}
                href={safeHref(e.href, routeFor(locale, world))}
              >
                {e.label || tr(B.details, locale)}
                <ArrowUpRight size={16} />
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  );
}
export function Closing({ extraFaq = [] }: { extraFaq?: Step[] }) {
  const { world, locale, brief } = useWorld();
  return (
    <>
      <Published />
      <Catalogue />
      <Section id="world-questions" title={B.question} tone="paper">
        <div className={s.faq}>
          {[
            ...extraFaq,
            { title: B.faqScope, body: B.faqScopeBody },
            { title: B.faqPrice, body: B.faqPriceBody },
            { title: B.faqStart, body: B.faqStartBody },
          ].map((f) => (
            <details key={f.title.en}>
              <summary>{tr(f.title, locale)}</summary>
              <p>{tr(f.body, locale)}</p>
            </details>
          ))}
        </div>
      </Section>
      <Enquiry world={world} locale={locale} brief={brief} />
    </>
  );
}
