"use client";
import { ManagedImage } from "../marketplace-imagery/ManagedImage";
import { imageryToken } from "../marketplace-imagery/pages";
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
  safeHref,
} from "../storefront-immersive/contract";
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
import { CommercialOpening, CommerceCatalogue, CommerceCollections, ProjectSummary } from './Commerce';
import type { PublicResource } from '../storefront-immersive/native-context';
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
  project: DiscoveryItem[];
  toggleProject: (id: string) => void;
  plan: PublicResource | null;
  choosePlan: (plan: PublicResource | null) => void;
  selections: ReturnType<typeof useSelections>;
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
    [projectIds, setProjectIds] = useState<string[]>([]),
    [planId, setPlanId] = useState<string | null>(null),
    [motion, setMotion] = useState(true),
    [dockVisible, setDockVisible] = useState(false),
    root = useRef<HTMLDivElement>(null);
  const items = useMemo(() => canonicalItems(experience), [experience]);
  const selections = useSelections(experience, items);
  const plan = native.resources.find(resource => resource.kind === 'plan' && resource.id === planId) || null;
  const choosePlan = (resource: PublicResource | null) => setPlanId(resource && native.resources.some(value => value.kind === 'plan' && value.id === resource.id) ? resource.id : null);
  const project = items.filter(item => projectIds.includes(item.id));
  const toggleProject = (id: string) => {
    if (!items.some(item => item.id === id)) return;
    setProjectIds(prior => prior.includes(id) ? prior.filter(value => value !== id) : prior.length >= 8 ? prior : [...prior, id]);
  };
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
  const prioritiesBrief = prioritySummary(
    world,
    locale,
    selected,
    Object.values(context),
  );
  const identityBrief = [...project.map(item => `${item.name.slice(0, 60)} [${item.id}]`), ...(plan ? [`PARTNER OS: ${plan.title.slice(0, 60)} [${plan.id}] · ${plan.period || ''}`] : [])].join('\n');
  const scopedIdentity = [experience.territoryCode ? `Territory: ${experience.territoryCode}` : '', identityBrief].filter(Boolean).join('\n');
  const brief = [prioritiesBrief.slice(0, Math.max(0, 1999 - scopedIdentity.length)), scopedIdentity].filter(Boolean).join('\n');
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
        project,
        toggleProject,
        plan,
        choosePlan,
        selections,
      }}
    >
      <div
        ref={root}
        className={`${s.world} ${s[world.replace("-", "_")] || ""}`}
        data-business-world={world}
        data-business-revision="AC-7SF-R1"
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
  slot,
  name,
  alt = "",
  priority = false,
  className = "",
}: {
  slot?: string;
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
        <ManagedImage slot={slot}
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
  const [active, setActive] = useState('');
  const ids = [...entries.map(entry => entry.id), 'world-offers', 'world-enquiry'].join('|');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(observations => {
      const visible = observations.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-180px 0px -45% 0px' });
    ids.split('|').forEach(id => { const section = document.getElementById(id); if (section) observer.observe(section); });
    return () => observer.disconnect();
  }, [ids]);
  return (
    <><nav className={s.worldNav} aria-label={tr(WORLDS[world].label, locale)}>
      <span>{tr(WORLDS[world].label, locale)}</span>
      {entries.map((e) => (
        <a key={e.id} href={`#${e.id}`} aria-current={active === e.id ? 'location' : undefined}>
          {tr(e.label, locale)}
        </a>
      ))}
      <a href="#world-offers" aria-current={active === 'world-offers' ? 'location' : undefined}>{tr(B.offers, locale)}</a>
      <a href="#world-enquiry" aria-current={active === 'world-enquiry' ? 'location' : undefined}>{tr(B.prepare, locale)}</a>
    </nav><CommercialOpening /></>
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
          <Picture slot={"visual.shared.1." + imageryToken(i)} name={d.photo} alt={tr(d.title, locale)} />
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
            <Picture slot={"visual.shared.2." + imageryToken(i)} name={t.photo} alt={tr(t.title, locale)} />
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
export function Catalogue() { return <CommerceCatalogue />; }

export function Published() {
  const { native, locale, world } = useWorld();
  const resources = native.resources.filter((r) => r.kind !== 'plan' && safeHref(r.href, "")),
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
  const { world, locale, brief, experience } = useWorld();
  return (
    <>
      <CommerceCollections />
      <Published />
      <Catalogue />
      <ProjectSummary />
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
      <Enquiry world={world} locale={locale} brief={brief} sourceRoute={routeFor(locale, world) + (experience.territoryCode ? `?territory=${encodeURIComponent(experience.territoryCode)}` : '')} />
    </>
  );
}
