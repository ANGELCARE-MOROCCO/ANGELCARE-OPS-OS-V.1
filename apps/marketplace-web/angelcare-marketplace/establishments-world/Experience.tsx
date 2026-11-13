"use client";
import { JourneyLink, JourneyContext } from "./JourneyLink";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
} from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  GitCompareArrows,
  Search,
  Sparkles,
  Layers3,
  X,
} from "lucide-react";
import type {
  DiscoveryItem,
  StorefrontExperience,
} from "../catalog-discovery/types";
import {
  businessItemHref,
  nativeAction,
  projection,
} from "../business-worlds/merchandising";
import { ProjectEnquiry } from "./ProjectEnquiry";
import { NativeExplorer, OfferImage } from "./OfferExplorer";
import { Pagination } from "./ExplorerControls";
import {
  HeroSignals,
  JourneyFAQ,
  ModuleIcon,
  ProgrammeDeliverables,
  PROGRAMME_POINTS,
} from "./JourneyEditorial";
import { useProject, useSessionValue } from "./useJourneyState";
import { availabilityLabel } from "../storefront-immersive/contract";
import { useSelections } from "../storefront-immersive/useSelections";
import { ManagedImage } from "../marketplace-imagery/ManagedImage";
import {
  asset,
  FAMILIES,
  FORMULA_IMAGES,
  LEVELS,
  formulaLevel,
  FORMULAS,
  METHOD,
  MODULES,
  PRODUCT_CHAPTERS,
  PROGRAMME_STORIES,
  VIEWS,
  type Family,
  type Formula,
  type Module,
  type View,
} from "./content";
import {
  blocked,
  linkedOffer,
  price,
  requestBrief,
  searchText,
  formulaSelection,
  offerSelection,
  viewFromHash,
  type Selection,
} from "./model";
import s from "./journey.module.css";
import p from "./premium.module.css";
import { campaignSet } from "./media";
import {
  ChapterNavigation,
  ExplorerIdentity,
  HeroExhibit,
  JourneyFinder,
  ModuleGraphic,
  ProjectBoard,
  UniverseMark,
} from "./PremiumJourney";
import type { JourneyResult } from "./journey-search";

type Detail = {
  title: string;
  eyebrow: string;
  image: string;
  body: string;
  facts: string[];
  selection: Selection;
  href?: string;
  native?: DiscoveryItem;
  action?: { href: string; label: string } | null;
};
const money = (amount: number) => new Intl.NumberFormat("fr-FR").format(amount);
function SourceImage({
  name,
  alt,
  eager = false,
  className = "",
  sizes,
}: {
  name: string;
  alt: string;
  eager?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <ManagedImage
      slot={`journey-r4.${name}`}
      src={asset(name)}
      srcSet={campaignSet(name)}
      sizes={
        sizes ||
        (eager
          ? "(min-width: 1600px) 720px, 52vw"
          : "(min-width: 1600px) 640px, 44vw")
      }
      width={1536}
      height={1024}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      className={`${s.visual} ${className}`}
    />
  );
}
function Heading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className={s.heading}>
      {eyebrow && <span>{eyebrow}</span>}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </header>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return <div className={s.empty}>{children}</div>;
}

export function EstablishmentsExperience({
  experience,
}: {
  experience: StorefrontExperience;
}) {
  const [view, setView] = useState<View>("conseil");
  const { project, notice, dispatch } = useProject(
    experience.items,
    experience.territoryCode,
  );
  const [detail, setDetail] = useState<Detail | null>(null);
  const [panel, setPanel] = useState<"finder" | "project" | null>(null);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.key !== "/" ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target?.closest("input, textarea, select, [contenteditable], dialog")
      )
        return;
      event.preventDefault();
      setPanel("finder");
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const [motionChoice, setMotionChoice] = useSessionValue(
    "ac.establishments.motion.v3",
    true,
    (value) => value !== false,
  );
  const [systemReduced, setSystemReduced] = useState(false);
  const motion = motionChoice && !systemReduced;
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSystemReduced(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  const root = useRef<HTMLDivElement>(null);
  const currentView = useRef<View>("conseil");
  const [activeSection, setActiveSection] = useState("ew-explorer");
  const selections = useSelections(experience, experience.items);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => dispatch({ type: "dismiss" }), 7000);
    return () => clearTimeout(timer);
  }, [notice, project.length, dispatch]);
  const selectedView = VIEWS.find((item) => item.key === view)!;
  const sourceRoute = `/angelcare-marketplace/fr/establishments${experience.territoryCode ? `?territory=${encodeURIComponent(experience.territoryCode)}` : ""}#${view}`;
  useEffect(() => {
    const read = () => {
      const next = viewFromHash(window.location.hash);
      currentView.current = next;
      setView(next);
      setDetail(null);
      setPanel(null);
      const target = window.location.hash.split("/")[1];
      if (target)
        requestAnimationFrame(() =>
          document
            .getElementById(target)
            ?.scrollIntoView({ block: "start", behavior: "instant" }),
        );
    };
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, []);
  useEffect(() => {
    if (
      !motion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-seen", "true");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    root.current
      ?.querySelectorAll("[data-reveal]")
      .forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [motion, view]);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActiveSection(entry.target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: 0 },
    );
    root.current
      ?.querySelectorAll(
        "#ew-explorer,#ew-stories,#ew-why,#ew-questions,#world-enquiry",
      )
      .forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [view]);
  function navigate(next: View) {
    if (next === currentView.current) return;
    currentView.current = next;
    setView(next);
    setDetail(null);
    setPanel(null);
    setActiveSection("ew-explorer");
    history.pushState(
      null,
      "",
      `${location.pathname}${location.search}#${next}`,
    );
    root.current?.scrollIntoView({ block: "start", behavior: "instant" });
    requestAnimationFrame(() =>
      root.current?.querySelector("h1")?.focus({ preventScroll: true }),
    );
  }
  function follow(event: MouseEvent<HTMLAnchorElement>, next: View) {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate(next);
  }
  function add(item: Selection) {
    dispatch({ type: "toggle", item });
  }
  function freeYear() {
    const full =
      project.length >= 8 &&
      !project.some((item) => item.key === "intent:partner-free-year");
    dispatch({ type: "free" });
    document
      .getElementById(full ? "ew-project-tray" : "world-enquiry")
      ?.scrollIntoView({
        behavior: motion ? "smooth" : "instant",
        block: "start",
      });
  }
  function offerDetail(item: DiscoveryItem) {
    setDetail({
      title: item.name,
      eyebrow: item.category_title || "Offre publiée",
      image: "",
      body:
        item.description ||
        item.short_description ||
        "Consultez les caractéristiques publiées et le parcours de cette offre.",
      facts: [
        price(item),
        availabilityLabel(item, "fr"),
        `Référence ${item.public_reference}`,
        ...(projection(item)?.fields.map(
          (fact) => `${fact.label} : ${fact.value}`,
        ) || []),
      ],
      selection: offerSelection(item),
      native: item,
      href: businessItemHref(item, "fr", experience.territoryCode),
      action: blocked(item)
        ? null
        : nativeAction(item, "fr", experience.territoryCode),
    });
  }
  function formulaDetail(formula: Formula) {
    const offer = linkedOffer(formula, experience.items);
    setDetail({
      title: formula.name,
      eyebrow: FAMILIES.find((f) => f.key === formula.family)!.name,
      image:
        FORMULA_IMAGES[formula.id] ||
        FAMILIES.find((f) => f.key === formula.family)!.image,
      body: "Une formule de référence issue du catalogue. Le périmètre, les disponibilités et les conditions sont précisés dans votre proposition.",
      facts: [
        ...new Set([
          formula.frequency,
          formula.volume,
          formula.reporting,
          formula.support,
          ...formula.facts,
        ]),
      ],
      selection: formulaSelection(formula),
      href: offer
        ? businessItemHref(offer, "fr", experience.territoryCode)
        : undefined,
    });
  }
  function moduleDetail(module: Module) {
    setDetail({
      title: module.title,
      eyebrow: `Partner OS · ${module.group}`,
      image: module.image,
      body: `${module.text} La disponibilité de cette capacité dépend du plan et de la configuration choisis.`,
      facts: [
        "Périmètre à étudier selon votre établissement",
        "Conditions du plan gratuit à consulter",
        "Options et accompagnement à préciser dans la proposition",
      ],
      selection: {
        key: `module:${module.id}`,
        kind: "module",
        title: module.title,
        detail: module.text,
      },
    });
  }
  function chooseResult(result: JourneyResult) {
    setPanel(null);
    navigate(result.view);
    if (result.type === "invitation") {
      requestAnimationFrame(freeYear);
    } else if (result.type === "formula") {
      const formula = FORMULAS.find((item) => item.id === result.target);
      if (formula) formulaDetail(formula);
    } else if (result.type === "module") {
      const module = MODULES.find((item) => item.id === result.target);
      if (module) moduleDetail(module);
    } else if (result.type === "offer") {
      const offer = experience.items.find((item) => item.id === result.target);
      if (offer) offerDetail(offer);
    } else {
      history.pushState(
        null,
        "",
        `${location.pathname}${location.search}#produits/${result.target}`,
      );
      requestAnimationFrame(() =>
        document.getElementById(result.target)?.scrollIntoView({
          block: "start",
          behavior: motion ? "smooth" : "instant",
        }),
      );
    }
  }
  const selectedKeys = project.map((item) => item.key);
  return (
    <JourneyContext.Provider value={view}>
      <div
        ref={root}
        onClick={(event) => {
          if (
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          const anchor = (event.target as HTMLElement).closest(
            'a[href^="#"]',
          ) as HTMLAnchorElement | null;
          const id = anchor?.getAttribute("href")?.slice(1).split("/").at(-1);
          if (!id || !document.getElementById(id)) return;
          event.preventDefault();
          history.pushState(
            null,
            "",
            `${location.pathname}${location.search}#${view}/${id}`,
          );
          document.getElementById(id)?.scrollIntoView({
            block: "start",
            behavior: motion ? "smooth" : "instant",
          });
        }}
        className={`${s.world} ${p.premium}`}
        data-establishments-journey="R4"
        data-view={view}
        data-motion={motion ? "on" : "off"}
      >
        <nav
          className={`${s.gateway} ${p.gateway}`}
          aria-label="Les trois spécialités Établissements"
        >
          <span className={s.breadcrumb}>
            Établissements <span>/</span> <b>{selectedView.label}</b>
          </span>
          <div>
            {VIEWS.map((item) => (
              <JourneyLink
                key={item.key}
                href={`#${item.key}`}
                aria-current={view === item.key ? "page" : undefined}
                onClick={(event) => follow(event, item.key)}
              >
                <img
                  src={asset(item.image).replace(".png", "-640.png")}
                  width={60}
                  height={49}
                  alt=""
                  decoding="async"
                />
                <span>
                  {item.label}
                  <small>
                    {item.key === "conseil"
                      ? "3 leviers · 9 formules"
                      : item.key === "partner-os"
                        ? "20 capacités · 1 an gratuit"
                        : "16 univers · votre projet"}
                  </small>
                </span>
                <ArrowRight size={14} />
              </JourneyLink>
            ))}
          </div>
        </nav>
        <nav
          className={`${s.anchors} ${p.anchors}`}
          aria-label="Dans cette expérience"
        >
          <div className={p.sectionLinks}>
            <JourneyLink
              href="#ew-explorer"
              aria-current={
                activeSection === "ew-explorer" ? "location" : undefined
              }
            >
              Explorer <ArrowDown size={13} />
            </JourneyLink>
            <JourneyLink
              href="#ew-stories"
              aria-current={
                activeSection === "ew-stories" ? "location" : undefined
              }
            >
              {view === "produits"
                ? "Les 16 univers"
                : view === "partner-os"
                  ? "L’écosystème"
                  : "Les trois leviers"}
            </JourneyLink>
            <JourneyLink
              href="#ew-why"
              aria-current={activeSection === "ew-why" ? "location" : undefined}
            >
              Pourquoi AngelCare
            </JourneyLink>
            <JourneyLink
              href="#world-enquiry"
              aria-current={
                activeSection === "world-enquiry" ? "location" : undefined
              }
            >
              Mon projet <span>{project.length || ""}</span>
            </JourneyLink>
            <JourneyLink
              href="#ew-questions"
              aria-current={
                activeSection === "ew-questions" ? "location" : undefined
              }
            >
              Questions utiles
            </JourneyLink>
          </div>
          <div className={p.navTools}>
            <button
              type="button"
              className={p.utility}
              aria-keyshortcuts="/"
              title="Chercher une solution · raccourci /"
              onClick={() => setPanel("finder")}
            >
              <Search size={14} />
              Trouver une solution
            </button>
            <button
              type="button"
              className={p.utility}
              onClick={() => setPanel("project")}
            >
              <Layers3 size={14} />
              Ma sélection ({project.length})
            </button>
            <button
              type="button"
              aria-pressed={motion}
              disabled={systemReduced}
              title={
                systemReduced
                  ? "Préférence de mouvement réduit du système"
                  : undefined
              }
              onClick={() => setMotionChoice((value) => !value)}
            >
              Animations {motion ? "activées" : "réduites"}
            </button>
          </div>
        </nav>
        <section className={`${s.hero} ${p.hero}`}>
          <div className={`${s.heroCopy} ${p.copy}`}>
            <span className={s.eyebrow}>
              {view === "conseil"
                ? "Diagnostic partenariat gratuit"
                : view === "partner-os"
                  ? "Votre écosystème de pilotage"
                  : "Le marketplace des établissements qui avancent"}
            </span>
            <h1 tabIndex={-1}>{selectedView.title}</h1>
            <p>{selectedView.lead}</p>
            {view === "partner-os" && (
              <div className={s.freeBadge}>
                <strong>1 AN GRATUIT</strong>
                <span>12 mois complets sur le plan gratuit</span>
              </div>
            )}
            <div className={s.actions}>
              {view === "partner-os" ? (
                <button className={s.primary} onClick={freeYear}>
                  Découvrir mon année gratuite
                  <ArrowRight size={16} />
                </button>
              ) : view === "conseil" ? (
                <JourneyLink className={s.primary} href="#world-enquiry">
                  Planifier mon diagnostic gratuit
                  <ArrowRight size={16} />
                </JourneyLink>
              ) : (
                <JourneyLink className={s.primary} href="#ew-explorer">
                  Explorer les produits
                  <ArrowRight size={16} />
                </JourneyLink>
              )}
              {view === "produits" ? (
                <JourneyLink className={s.secondary} href="#world-enquiry">
                  Construire mon projet
                </JourneyLink>
              ) : (
                <JourneyLink className={s.secondary} href="#ew-explorer">
                  {view === "conseil"
                    ? "Explorer les formules"
                    : "Explorer Partner OS"}
                </JourneyLink>
              )}
            </div>
            <HeroSignals view={view} />
            {view === "partner-os" && (
              <small>
                Fonctionnalités selon le plan choisi. Le périmètre et
                l’activation de l’offre sont à confirmer.
              </small>
            )}
          </div>
          <div className={`${s.heroMedia} ${p.photo}`}>
            <SourceImage
              name={selectedView.image}
              alt={
                view === "partner-os"
                  ? "Professionnelle et aperçu illustratif de Partner OS, scène illustrative"
                  : view === "produits"
                    ? "Produits et équipements éducatifs, scène illustrative"
                    : "Accompagnement des équipes, enfants et familles, scène illustrative"
              }
              eager
            />
            <HeroExhibit view={view} />
          </div>
        </section>
        <section
          id="ew-explorer"
          className={`${s.explorer} ${p.explorer}`}
          aria-label="Exploration des offres"
        >
          <ExplorerIdentity
            view={view}
            count={
              experience.items.filter(
                (item) => item.kind === "product" || item.kind === "kit",
              ).length
            }
          />
          {view === "conseil" ? (
            <ProgrammeExplorer
              offers={experience.items}
              territory={experience.territoryCode}
              onDetail={formulaDetail}
              onAdd={add}
              selected={selectedKeys}
            />
          ) : view === "partner-os" ? (
            <PartnerExplorer onModule={moduleDetail} onFree={freeYear} />
          ) : (
            <Heading title="Explorez les produits & équipements">
              Recherchez, comparez et préparez une sélection issue des offres
              publiées.
            </Heading>
          )}
          <NativeExplorer
            key={view}
            experience={experience}
            view={view}
            selected={selectedKeys}
            add={add}
            selections={selections}
            onDetail={offerDetail}
          />
          <ProjectTray
            project={project}
            remove={(key) => dispatch({ type: "remove", key })}
          />
        </section>
        <section
          className={`${s.crossroads} ${p.crossroads}`}
          aria-label="Accéder aux autres spécialités"
        >
          {VIEWS.filter((item) => item.key !== view).map((item) => (
            <JourneyLink
              key={item.key}
              href={`#${item.key}`}
              onClick={(event) => follow(event, item.key)}
            >
              <SourceImage name={item.image} alt="" />
              <span>
                <small>Également pour votre établissement</small>
                <strong>{item.label}</strong>
                <ArrowRight size={20} />
              </span>
            </JourneyLink>
          ))}
        </section>
        {view === "conseil" ? (
          <ProgrammeStories />
        ) : view === "produits" ? (
          <ProductStories />
        ) : (
          <PartnerStories onFree={freeYear} />
        )}
        <Why view={view} />
        <JourneyFAQ view={view} />
        <section className={`${s.method} ${p.method}`} data-reveal>
          <Heading
            eyebrow="Une démarche concrète"
            title={
              view === "partner-os"
                ? "De votre besoin à votre mise en route."
                : "Du premier échange au suivi."
            }
          >
            Comprendre le contexte, préciser le périmètre et préparer les
            prochaines actions.
          </Heading>
          <div className={s.methodGrid}>
            {METHOD.map(([title, text], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={s.contactLead}>
          <div>
            <span className={s.eyebrow}>
              {view === "partner-os"
                ? "1 an gratuit · 12 mois complets"
                : view === "conseil"
                  ? "Diagnostic partenariat gratuit"
                  : "Votre identité. Vos espaces. Votre projet."}
            </span>
            <h2>
              {view === "partner-os"
                ? "Votre prochaine année peut changer votre façon de piloter."
                : view === "conseil"
                  ? "Ne laissez pas votre différence rester invisible."
                  : "Et si tout devenait cohérent ?"}
            </h2>
            <p>
              {view === "partner-os"
                ? "Le plan gratuit et ses conditions sont étudiés avec vous. Cette demande ne vaut pas activation automatique."
                : "Présentez votre établissement, votre priorité et les éléments que vous souhaitez étudier."}
            </p>
          </div>
          <SourceImage
            name={
              view === "partner-os"
                ? "partner-hero"
                : view === "produits"
                  ? "administration"
                  : "consulting-method"
            }
            alt="Accompagnement du projet de votre établissement"
          />
        </section>
        <div className={s.contact}>
          <ProjectEnquiry
            view={view}
            brief={requestBrief(view, project, experience.territoryCode)}
            sourceRoute={sourceRoute}
          />
        </div>
        <p
          className={s.noticeToast}
          role="status"
          aria-live="polite"
          key={notice}
        >
          {notice}
        </p>
        {panel === "finder" && (
          <JourneyFinder
            offers={experience.items}
            onChoose={chooseResult}
            onClose={() => setPanel(null)}
          />
        )}
        {panel === "project" && (
          <ProjectBoard
            project={project}
            view={view}
            territory={experience.territoryCode}
            remove={(key) => dispatch({ type: "remove", key })}
            onClose={() => setPanel(null)}
          />
        )}
        {detail && (
          <DetailDialog
            detail={detail}
            selected={selectedKeys.includes(detail.selection.key)}
            onClose={() => setDetail(null)}
            onSelect={() => add(detail.selection)}
          />
        )}
      </div>
    </JourneyContext.Provider>
  );
}

function ProjectTray({
  project,
  remove,
}: {
  project: Selection[];
  remove: (key: string) => void;
}) {
  return (
    <div id="ew-project-tray" className={s.tray}>
      <span>
        Mon projet <b>{project.length}/8</b>
      </span>
      <div>
        {project.length ? (
          project.map((item) => (
            <button
              key={item.key}
              onClick={() => remove(item.key)}
              aria-label={`Retirer ${item.title}`}
            >
              {item.title}
              <X size={13} />
            </button>
          ))
        ) : (
          <small>
            Ajoutez des offres, des formules ou des capacités à étudier.
          </small>
        )}
      </div>
      <JourneyLink href="#world-enquiry">
        Préparer ma demande
        <ArrowRight size={15} />
      </JourneyLink>
    </div>
  );
}

function ProgrammeExplorer({
  offers,
  territory,
  onDetail,
  onAdd,
  selected,
}: {
  offers: DiscoveryItem[];
  territory?: string | null;
  onDetail: (formula: Formula) => void;
  onAdd: (selection: Selection) => void;
  selected: string[];
}) {
  const [programmeFilters, setProgrammeFilters] = useSessionValue(
    `ac.establishments.programmes.v3:${territory || "default"}`,
    { family: "all", query: "", level: "all" },
    (value) => {
      const v =
        value && typeof value === "object"
          ? (value as Record<string, unknown>)
          : {};
      return {
        family: ["all", "edup", "academy", "parents"].includes(String(v.family))
          ? String(v.family)
          : "all",
        query: typeof v.query === "string" ? v.query.slice(0, 160) : "",
        level: ["all", "0", "1", "2"].includes(String(v.level))
          ? String(v.level)
          : "all",
      };
    },
  );
  const { family, query, level } = programmeFilters;
  const setFamily = (family: string) =>
    setProgrammeFilters((previous) => ({ ...previous, family }));
  const setQuery = (query: string) =>
    setProgrammeFilters((previous) => ({ ...previous, query }));
  const [compared, setCompared] = useState<string[]>([]);
  const [comparisonFamily, setComparisonFamily] = useState<Family>("edup");
  const filtered = FORMULAS.filter(
    (formula) =>
      (family === "all" || formula.family === family) &&
      (level === "all" || formulaLevel(formula) === level) &&
      (!query ||
        searchText(
          `${formula.name} ${formula.facts.join(" ")} ${formula.frequency}`,
        ).includes(searchText(query))),
  );
  const comparisons = FORMULAS.filter(
    (formula) =>
      formula.family === comparisonFamily &&
      (!compared.length || compared.includes(formula.id)),
  );
  function compare(formula: Formula) {
    setComparisonFamily(formula.family);
    setCompared((previous) =>
      previous.includes(formula.id)
        ? previous.filter((id) => id !== formula.id)
        : [
            ...previous.filter(
              (id) =>
                FORMULAS.find((value) => value.id === id)?.family ===
                formula.family,
            ),
            formula.id,
          ].slice(-3),
    );
  }
  return (
    <>
      <Heading title="Trouvez le programme qui répond à votre priorité.">
        Trois leviers complémentaires. Neuf formules de référence à étudier
        selon votre contexte.
      </Heading>
      <div
        className={p.guidedNeeds}
        role="group"
        aria-label="Choisir mon objectif"
      >
        <span>
          <Sparkles size={16} />
          Votre priorité aujourd’hui ?
        </span>
        {FAMILIES.map((item) => (
          <button
            key={item.key}
            aria-pressed={family === item.key}
            onClick={() => setFamily(family === item.key ? "all" : item.key)}
          >
            {item.purpose}
          </button>
        ))}
      </div>
      <div className={s.priorities}>
        {FAMILIES.map((item) => (
          <button
            key={item.key}
            data-family={item.key}
            aria-pressed={family === item.key}
            onClick={() => setFamily(family === item.key ? "all" : item.key)}
          >
            <SourceImage name={item.image} alt="" />
            <span>
              <strong>{item.name}</strong>
              {item.purpose}
            </span>
            <CheckCircle2 size={19} />
          </button>
        ))}
      </div>
      <div className={s.toolbar}>
        <label>
          <Search size={17} />
          <span className={s.sr}>Rechercher une formule</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Un besoin, un programme, un objectif…"
          />
        </label>
        <label className={s.selectLabel}>
          Votre priorité
          <select
            value={family}
            onChange={(event) =>
              setFamily(event.target.value as Family | "all")
            }
          >
            <option value="all">Tous les leviers</option>
            {FAMILIES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.purpose}
              </option>
            ))}
          </select>
        </label>
        <label className={s.selectLabel}>
          Votre progression
          <select
            value={level}
            onChange={(event) =>
              setProgrammeFilters((previous) => ({
                ...previous,
                level: event.target.value,
              }))
            }
          >
            {LEVELS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className={s.textButton}
          onClick={() =>
            setProgrammeFilters({ family: "all", query: "", level: "all" })
          }
        >
          Réinitialiser
        </button>
      </div>
      <div
        className={s.familyTabs}
        role="group"
        aria-label="Familles de programmes"
      >
        <button
          aria-pressed={family === "all"}
          onClick={() => setFamily("all")}
        >
          Toutes les formules ({FORMULAS.length})
        </button>
        {FAMILIES.map((item) => (
          <button
            key={item.key}
            data-family={item.key}
            aria-pressed={family === item.key}
            onClick={() => setFamily(item.key)}
          >
            {item.name} (
            {FORMULAS.filter((formula) => formula.family === item.key).length})
          </button>
        ))}
      </div>
      <p className={s.resultsStatus} role="status">
        {filtered.length} formule{filtered.length > 1 ? "s" : ""} à étudier
      </p>
      <div className={`${s.offerGrid} ${p.offerGrid}`}>
        {filtered.map((formula) => {
          const familyInfo = FAMILIES.find(
            (item) => item.key === formula.family,
          )!;
          const published = linkedOffer(formula, offers);
          const prepared = selected.includes(`formula:${formula.id}`);
          return (
            <article
              key={formula.id}
              className={`${s.formulaCard} ${p.formulaCard}`}
              data-family={formula.family}
              data-selected={prepared}
            >
              <SourceImage
                name={FORMULA_IMAGES[formula.id] || familyInfo.image}
                alt={`Illustration du programme ${familyInfo.name}`}
                sizes="(min-width: 1600px) 430px, 30vw"
              />
              <div>
                <span className={p.cardTag}>
                  <CheckCircle2 size={11} />
                  {
                    ["Démarrer", "Structurer", "Approfondir"][
                      Number(formulaLevel(formula))
                    ]
                  }
                </span>
                <br />
                <span className={s.cardEyebrow}>{familyInfo.name}</span>
                <h3>{formula.name}</h3>
                <ul>
                  <li>{formula.frequency}</li>
                  <li>{formula.volume}</li>
                  {formula.facts
                    .filter(
                      (fact) =>
                        fact !== formula.frequency && fact !== formula.volume,
                    )
                    .slice(0, 3)
                    .map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                </ul>
                <p className={s.price}>
                  <small>Tarif de référence du catalogue</small>
                  <strong>
                    {money(formula.amount)} MAD <small>/ {formula.unit}</small>
                  </strong>
                </p>
                <div className={s.cardActions}>
                  <button onClick={() => onDetail(formula)}>
                    Voir les détails
                    <ArrowRight size={13} />
                  </button>
                  <label>
                    <input
                      type="checkbox"
                      checked={compared.includes(formula.id)}
                      onChange={() => compare(formula)}
                    />
                    Comparer
                  </label>
                </div>
                <button
                  className={s.familyButton}
                  aria-pressed={prepared}
                  onClick={() => onAdd(formulaSelection(formula))}
                >
                  {prepared ? <Check size={14} /> : null}
                  {prepared ? "Dans mon projet" : "Étudier cette formule"}
                </button>
                {published && (
                  <Link
                    className={s.nativeLink}
                    href={businessItemHref(published, "fr", territory)}
                  >
                    Consulter l’offre publiée
                    <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <Empty>
          Aucune formule ne correspond à ces critères. Ajustez votre recherche
          ou réinitialisez les filtres.
        </Empty>
      )}
      <div className={s.comparison}>
        <div className={s.comparisonTitle}>
          <GitCompareArrows size={24} />
          <div>
            <h3>Comparer les formules de la même famille.</h3>
            <p>
              Analysez la cadence, les livrables et l’accompagnement, avec leurs
              unités propres.
            </p>
          </div>
          <select
            aria-label="Famille à comparer"
            value={comparisonFamily}
            onChange={(event) => {
              setComparisonFamily(event.target.value as Family);
              setCompared([]);
            }}
          >
            {FAMILIES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className={s.tableWrap}>
          <table>
            <thead>
              <tr>
                <th scope="col">Critère</th>
                {comparisons.map((formula) => (
                  <th scope="col" key={formula.id}>
                    {formula.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["frequency", "volume", "reporting", "support"] as const).map(
                (key, index) => (
                  <tr key={key}>
                    <th scope="row">
                      {
                        [
                          "Cadence",
                          "Périmètre",
                          "Suivi & livrables",
                          "Accompagnement",
                        ][index]
                      }
                    </th>
                    {comparisons.map((formula) => (
                      <td key={formula.id}>{formula[key]}</td>
                    ))}
                  </tr>
                ),
              )}
              <tr>
                <th scope="row">Tarif catalogue</th>
                {comparisons.map((formula) => (
                  <td key={formula.id}>
                    {money(formula.amount)} MAD / {formula.unit}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        {compared.length > 0 && (
          <button className={s.textButton} onClick={() => setCompared([])}>
            Comparer toute cette famille
          </button>
        )}
      </div>
      <p className={s.scope}>
        Les formules et tarifs ci-dessus sont les repères de votre brochure. La
        proposition précise le périmètre et les disponibilités. Les offres
        publiées ci-dessous conservent leurs propres conditions.
      </p>
    </>
  );
}

function PartnerExplorer({
  onModule,
  onFree,
}: {
  onModule: (module: Module) => void;
  onFree: () => void;
}) {
  const [moduleFilters, setModuleFilters] = useSessionValue(
    "ac.establishments.modules.v3",
    { query: "", group: "all", page: 1 },
    (value) => {
      const v =
        value && typeof value === "object"
          ? (value as Record<string, unknown>)
          : {};
      return {
        query: typeof v.query === "string" ? v.query.slice(0, 160) : "",
        group: ["all", ...MODULES.map((item) => item.group)].includes(
          String(v.group),
        )
          ? String(v.group)
          : "all",
        page:
          typeof v.page === "number" && Number.isInteger(v.page)
            ? Math.max(1, Math.min(3, v.page))
            : 1,
      };
    },
  );
  const { query, group, page } = moduleFilters;
  const setQuery = (query: string) =>
    setModuleFilters((previous) => ({ ...previous, query, page: 1 }));
  const setGroup = (group: string) =>
    setModuleFilters((previous) => ({ ...previous, group, page: 1 }));
  const setPage = (page: number) =>
    setModuleFilters((previous) => ({ ...previous, page }));
  const modules = MODULES.filter(
    (item) =>
      (group === "all" || item.group === group) &&
      (!query ||
        searchText(`${item.title} ${item.text}`).includes(searchText(query))),
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(modules.length / 8)));
  return (
    <>
      <Heading title="Explorez Partner OS et trouvez votre point de départ.">
        Une plateforme pour relier vos équipes, vos familles et vos opérations.
      </Heading>
      <div className={s.planStrip}>
        <article>
          <span className={s.eyebrow}>Une année entière</span>
          <h3>Plan gratuit · 12 mois</h3>
          <p>
            Découvrez le périmètre de l’offre et préparez votre mise en route.
          </p>
          <button className={s.primary} onClick={onFree}>
            Découvrir mon année gratuite
            <ArrowRight size={15} />
          </button>
        </article>
        <article>
          <h3>Modules & options</h3>
          <p>
            Faites évoluer votre environnement selon vos besoins et votre plan.
          </p>
          <JourneyLink href="#ew-stories">
            Comprendre les capacités
            <ArrowDown size={14} />
          </JourneyLink>
        </article>
        <article>
          <h3>Accompagnement</h3>
          <p>
            Un projet à définir selon vos usages, votre configuration et votre
            établissement.
          </p>
          <JourneyLink href="#world-enquiry">
            Présenter mon projet
            <ArrowRight size={14} />
          </JourneyLink>
        </article>
      </div>
      <div className={s.toolbar}>
        <label>
          <Search size={17} />
          <span className={s.sr}>Rechercher une capacité Partner OS</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Un module, un besoin, un usage…"
          />
        </label>
        <label className={s.selectLabel}>
          Votre besoin
          <select
            value={group}
            onChange={(event) => {
              setGroup(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">Toutes les capacités</option>
            {[...new Set(MODULES.map((item) => item.group))].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <div
        className={s.categoryRail}
        id="ew-module-explorer"
        role="group"
        aria-label="Domaines Partner OS"
      >
        <button aria-pressed={group === "all"} onClick={() => setGroup("all")}>
          Tous les domaines ({MODULES.length})
        </button>
        {[...new Set(MODULES.map((item) => item.group))].map((value) => (
          <button
            key={value}
            aria-pressed={group === value}
            onClick={() => setGroup(value)}
          >
            <ModuleIcon group={value} />
            {value}
          </button>
        ))}
      </div>
      <div className={`${s.moduleGrid} ${p.moduleGrid}`}>
        {modules.slice((safePage - 1) * 8, safePage * 8).map((module) => (
          <article key={module.id} data-group={module.group}>
            <ModuleGraphic module={module} />
            <span className={s.moduleBadge}>
              <ModuleIcon group={module.group} id={module.id} />
              {module.group}
            </span>
            <h3>{module.title}</h3>
            <p>{module.text}</p>
            <button className={s.textButton} onClick={() => onModule(module)}>
              Explorer cette capacité
              <ArrowRight size={14} />
            </button>
          </article>
        ))}
      </div>
      {!modules.length && (
        <Empty>Aucune capacité ne correspond à votre recherche.</Empty>
      )}
      <Pagination
        page={safePage}
        pages={Math.max(1, Math.ceil(modules.length / 8))}
        count={modules.length}
        onPage={setPage}
      />
      <p className={s.scope}>
        Vingt domaines présentés dans la brochure. Leur disponibilité dépend du
        plan et de la configuration ; ils ne sont pas tous inclus dans le plan
        gratuit. Cette invitation ne remplace pas l’activation du plan.
      </p>
    </>
  );
}

function ProgrammeStories() {
  return (
    <section id="ew-stories" className={`${s.stories} ${p.stories}`}>
      <div className={`${s.editorialIntro} ${p.editorialIntro}`}>
        <SourceImage
          name="child-experience"
          alt="Atelier accompagné avec les enfants"
        />
        <div>
          <span className={s.eyebrow}>
            Enrichir · Professionnaliser · Valoriser
          </span>
          <h2>
            Votre qualité existe. Les familles doivent pouvoir la comprendre.
          </h2>
          <p>
            Une activité bien pensée, une équipe cohérente, une communication
            claire : votre différence se construit dans l’expérience
            quotidienne.
          </p>
        </div>
      </div>
      {PROGRAMME_STORIES.map((story, index) => (
        <article
          key={story.family}
          data-reveal
          className={`${s.programmeStory} ${p.programmeStory}`}
          data-family={story.family}
        >
          <div className={`${s.storyImage} ${p.storyImage}`}>
            <SourceImage name={story.image} alt={story.title} />
            <span>
              0{index + 1} / {FAMILIES[index].name}
            </span>
          </div>
          <div>
            <span className={s.eyebrow}>{FAMILIES[index].purpose}</span>
            <h2>{story.title}</h2>
            <p>{story.text}</p>
            <div className={`${s.pointGrid} ${p.pointGrid}`}>
              {story.points.map((point, pointIndex) => (
                <div key={point}>
                  <CheckCircle2 size={19} />
                  <h3>{point}</h3>
                  <p>{PROGRAMME_POINTS[story.family][pointIndex]}</p>
                </div>
              ))}
            </div>
            <blockquote className={s.commercialQuote}>
              {story.family === "edup"
                ? "Ce que les parents ne voient pas, ils le valorisent difficilement."
                : story.family === "academy"
                  ? "La formation n’est pas une dépense. C’est une assurance qualité face aux attentes des parents."
                  : "La confiance ne se décrète pas. Elle se construit, se prouve et se valorise."}
            </blockquote>
            <div className={s.deliverables}>
              {story.deliverables.map((text) => (
                <span key={text}>{text}</span>
              ))}
            </div>
          </div>
        </article>
      ))}
      <ProgrammeDeliverables />
    </section>
  );
}
function ProductStories() {
  return (
    <section id="ew-stories" className={`${s.stories} ${p.stories}`}>
      <Heading title="16 univers. Une ambition : donner de la valeur à chaque détail.">
        Votre établissement a besoin d’un ensemble visible, organisé et
        rassurant.
      </Heading>
      <ChapterNavigation />
      {PRODUCT_CHAPTERS.map((chapter, index) => (
        <article
          key={chapter.title}
          id={`ew-chapter-${index + 1}`}
          data-reveal
          className={`${s.productChapter} ${p.productChapter}`}
        >
          <div className={`${s.chapterHero} ${p.chapterHero}`}>
            <div>
              <span className={s.eyebrow}>
                Chapitre {["I", "II", "III", "IV"][index]}
              </span>
              <h2>{chapter.title}</h2>
              <p>
                {
                  [
                    "Votre identité commence avant la première visite. Faites vivre une présence accueillante, visible et cohérente.",
                    "L’espace n’est pas un décor. C’est un outil pour manipuler, découvrir et gagner en autonomie.",
                    "Une organisation claire se voit dans les petits détails qui rassurent les équipes et les familles.",
                    "La qualité devient plus tangible quand les équipes partagent leurs outils, leurs repères et leurs responsabilités.",
                  ][index]
                }
              </p>
              <span className={p.chapterLabel}>
                <CheckCircle2 size={13} />4 univers complémentaires · sélection
                sur devis
              </span>
            </div>
            <SourceImage name={chapter.image} alt={chapter.title} />
          </div>
          <div className={`${s.universes} ${p.universes}`}>
            {chapter.universes.map((universe, subindex) => (
              <section key={universe.title}>
                <UniverseMark index={index * 4 + subindex} />
                <h3>{universe.title}</h3>
                <p>{universe.text}</p>
                <small>
                  {
                    [
                      "Première impression · identité",
                      "Repères visuels · cohérence",
                      "Supports de terrain · organisation",
                      "Pratiques partagées · continuité",
                    ][index]
                  }
                </small>
              </section>
            ))}
          </div>
        </article>
      ))}
      <div className={p.discoveryClose}>
        <div>
          <span>DE L’INSPIRATION À VOTRE SÉLECTION</span>
          <h3>Donnez une suite concrète aux besoins de votre établissement.</h3>
          <p>
            Retrouvez les offres publiées, leurs caractéristiques et leurs
            conditions dans l’explorateur.
          </p>
        </div>
        <JourneyLink className={s.primary} href="#ew-explorer">
          Composer ma sélection <ArrowRight size={16} />
        </JourneyLink>
      </div>
    </section>
  );
}
function PartnerStories({ onFree }: { onFree: () => void }) {
  const titles = [
    "Voir clair. Décider ensemble.",
    "Chaque demande mérite une vraie continuité.",
    "Votre offre mérite un système commercial.",
    "Vos équipes et les opérations doivent avancer ensemble.",
    "Suivre les détails avant qu’ils se dispersent.",
  ];
  return (
    <section id="ew-stories" className={`${s.stories} ${p.stories}`}>
      <div className={`${s.editorialIntro} ${p.editorialIntro}`}>
        <SourceImage
          name="os-people-intro"
          alt="Une équipe autour du projet de l’établissement"
        />
        <div>
          <span className={s.eyebrow}>
            Relier les métiers. Donner une continuité.
          </span>
          <h2>Votre établissement ne vit pas dans un tableau.</h2>
          <p>
            Il vit dans les échanges, les décisions et les actions. Donnez-leur
            un fil conducteur.
          </p>
        </div>
      </div>
      {[...new Set(MODULES.map((item) => item.group))].map((group, index) => {
        const modules = MODULES.filter((item) => item.group === group);
        return (
          <article
            key={group}
            data-reveal
            className={`${s.osChapter} ${p.osChapter}`}
            data-group={group}
          >
            <SourceImage
              name={
                [
                  "os-people-direction",
                  "os-people-admissions",
                  "os-people-commerce",
                  "os-people-team",
                  "os-people-followup",
                ][index]
              }
              alt={`Présentation illustrative : ${group}`}
            />
            <div>
              <span className={s.eyebrow}>
                Chapitre {index + 1} · {group}
              </span>
              <h2>{titles[index]}</h2>
              <div>
                {modules.map((module) => (
                  <section key={module.id}>
                    <ModuleIcon group={module.group} id={module.id} />
                    <h3>{module.title}</h3>
                    <p>{module.text}</p>
                  </section>
                ))}
              </div>
            </div>
          </article>
        );
      })}
      <section className={s.freeCampaign}>
        <SourceImage
          name="os-people-year"
          alt="Professionnelle dans l’environnement Partner OS"
        />
        <div>
          <h2>Une année entière pour commencer autrement.</h2>
          <strong>12 MOIS GRATUITS</strong>
          <p>
            Sur le plan gratuit. Le périmètre, les conditions et l’activation de
            l’offre sont étudiés avec vous.
          </p>
          <button className={s.primary} onClick={onFree}>
            Découvrir mon année gratuite
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </section>
  );
}
function Why({ view }: { view: View }) {
  const reasons =
    view === "partner-os"
      ? [
          [
            "Une sous-application par établissement",
            "Un environnement configuré selon le plan choisi.",
            "os-overview",
          ],
          [
            "Un écosystème modulaire",
            "Des capacités à étudier selon vos usages et votre organisation.",
            "os-services",
          ],
          [
            "Une continuité entre vos métiers",
            "Familles, équipes, opérations et suivi commercial pensés ensemble.",
            "os-crm",
          ],
          [
            "Un accompagnement selon votre projet",
            "Un cadre pour préciser le périmètre et préparer les prochaines étapes.",
            "academy",
          ],
        ]
      : view === "conseil"
        ? [
            [
              "L’enfant, l’équipe et les parents considérés ensemble",
              "Trois leviers pour relier l’expérience proposée, les pratiques et la relation famille-école.",
              "child-experience",
            ],
            [
              "Des formules structurées",
              "Une cadence, des livrables et un niveau d’accompagnement identifiables avant le choix.",
              "edupplay",
            ],
            [
              "Des outils pour les pratiques",
              "Des supports et des repères à préciser selon la formule retenue.",
              "programme-team",
            ],
            [
              "Une coordination avec la direction",
              "Des priorités et un périmètre à construire autour de votre établissement.",
              "parent-direction",
            ],
          ]
        : [
            [
              "Un projet cohérent",
              "Des espaces, des supports et des usages alignés.",
              "furniture",
            ],
            [
              "Des supports harmonisés",
              "Une identité lisible et des outils cohérents.",
              "parent-tools",
            ],
            [
              "Une personnalisation utile",
              "Des solutions adaptées aux besoins et au contexte de votre établissement.",
              "uniforms",
            ],
            [
              "Un accompagnement concret",
              "Du choix à la préparation du déploiement, des livrables à préciser ensemble.",
              "administration",
            ],
          ];
  return (
    <section id="ew-why" className={`${s.why} ${p.why}`} data-reveal>
      <Heading
        title={
          view === "partner-os"
            ? "Pourquoi AngelCare Partner OS ?"
            : "Pourquoi choisir AngelCare ?"
        }
      />
      <div>
        {reasons.map(([title, body, image]) => (
          <article key={title}>
            <SourceImage
              name={image}
              alt=""
              sizes="(min-width: 1600px) 340px, 23vw"
            />
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
function DetailDialog({
  detail,
  selected,
  onSelect,
  onClose,
}: {
  detail: Detail;
  selected: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={s.dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="ew-detail-title"
    >
      <button
        className={s.dialogClose}
        aria-label="Fermer le détail"
        onClick={onClose}
      >
        <X size={22} />
      </button>
      {detail.native ? (
        <div className={s.detailPicture}>
          <OfferImage item={detail.native} />
        </div>
      ) : detail.selection.kind === "module" &&
        MODULES.find((item) => `module:${item.id}` === detail.selection.key) ? (
        <ModuleGraphic
          module={MODULES.find(
            (item) => `module:${item.id}` === detail.selection.key,
          )!}
          large
        />
      ) : (
        <SourceImage name={detail.image} alt="" />
      )}
      <div>
        <span className={s.eyebrow}>{detail.eyebrow}</span>
        <h2 id="ew-detail-title">{detail.title}</h2>
        <p>{detail.body}</p>
        <ul>
          {detail.facts.map((fact, index) => (
            <li key={`${index}:${fact}`}>{fact}</li>
          ))}
        </ul>
        <div className={s.actions}>
          <button
            className={s.primary}
            aria-pressed={selected}
            disabled={!!detail.native && blocked(detail.native) && !selected}
            onClick={onSelect}
          >
            {selected ? "Retirer de mon projet" : "Ajouter à mon projet"}
            <ArrowRight size={15} />
          </button>
          {detail.action && (
            <Link className={s.primary} href={detail.action.href}>
              {detail.action.label}
              <ArrowRight size={15} />
            </Link>
          )}
          {detail.href && (
            <Link className={s.secondary} href={detail.href}>
              Ouvrir l’offre publiée
            </Link>
          )}
          <button className={s.textButton} onClick={onClose}>
            Continuer l’exploration
          </button>
        </div>
      </div>
    </dialog>
  );
}
