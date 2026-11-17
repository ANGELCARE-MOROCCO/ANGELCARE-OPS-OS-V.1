"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  Compass,
  FileCheck2,
  FileText,
  GraduationCap,
  HeartHandshake,
  Layers3,
  LayoutDashboard,
  Link2,
  MessageCircle,
  Monitor,
  Network,
  Package,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Ticket,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { ManagedImage } from "../../marketplace-imagery/ManagedImage";
import { campaignAsset, campaignSet } from "../media";
import type { ContactIntent } from "../CommercialJourney";
import { useSessionValue } from "../useJourneyState";
import {
  CHAPTERS,
  EMPTY_PRESENTATION,
  restorePresentation,
  type PartnerPresentation,
  MODULES,
  SITUATIONS,
  SITE_COUNTS,
  PRIORITIES,
  HORIZONS,
  FAQ,
  moduleByKey,
  chapterFor,
  recommended,
  toggleModule,
  type PartnerRequest,
  type ModuleKey,
  type ChapterKey,
} from "./content";
import { usePartner } from "./Locale";
import s from "./partner.module.css";
import {PartnerR2WorldLead,PartnerR2ModuleSwitcher,PartnerR2Atlas,PartnerR2ProjectMap,PartnerR2MobileNav} from "./PartnerR2Experience";
const ICONS: Record<ModuleKey, LucideIcon> = {
  direction: LayoutDashboard,
  sites: Network,
  reporting: BarChart3,
  admissions: FileCheck2,
  crm: HeartHandshake,
  parents: Users,
  communication: MessageCircle,
  planning: CalendarDays,
  operations: CheckCheck,
  rh: Users,
  formation: GraduationCap,
  qualite: ShieldCheck,
  roles: ShieldCheck,
  plans: FileText,
  services: Package,
  facturation: Receipt,
  paiements: Wallet,
  marketplace: Layers3,
  documents: FileText,
  support: Ticket,
};
const CHAPTER_ICONS: Record<ChapterKey, LucideIcon> = {
  direction: Building2,
  familles: Users,
  quotidien: CalendarDays,
  equipes: Users,
  revenus: BarChart3,
  ecosysteme: Layers3,
};
export function PartnerPhoto({
  kind = "direction",
  hero = false,
}: {
  kind?: "direction" | "parents" | "activities" | "team" | "finance";
  hero?: boolean;
}) {
  const { t } = usePartner();
  const alt = {
    direction:
      "Scène illustrative : direction d’un établissement préparant son pilotage",
    parents: "Scène illustrative : accueil et échange avec une famille",
    activities:
      "Scène illustrative : activité accompagnée en classe préscolaire",
    team: "Scène illustrative : équipe pédagogique préparant ses pratiques",
    finance:
      "Scène illustrative : préparation de la facturation et suivi administratif",
  }[kind];
  const names = {
    parents: "os-admissions",
    activities: "os-activities",
    team: "os-team",
  };
  const source =
    kind === "direction" || kind === "finance"
      ? `/angelcare-marketplace/partner-os-r1/${kind}-scene.png`
      : campaignAsset(names[kind]);
  return (
    <ManagedImage
      slot={hero ? "journey-partner.hero" : `journey-partner.${kind}`}
      src={source}
      srcSet={
        kind === "direction" || kind === "finance"
          ? undefined
          : campaignSet(names[kind])
      }
      sizes={
        hero
          ? "(min-width:1600px) 920px, 57vw"
          : "(min-width:1600px) 1476px, 90vw"
      }
      width={kind === "finance" ? 1774 : 1536}
      height={kind === "finance" ? 887 : 1024}
      alt={t(alt)}
      loading={hero ? "eager" : "lazy"}
      fetchPriority={hero ? "high" : undefined}
      decoding="async"
    />
  );
}
export function PartnerHero({
  onContact,
  onExplore,
}: {
  onContact: (intent: ContactIntent) => void;
  onExplore: () => void;
}) {
  const { t } = usePartner();
  return (
    <section className={s.hero} data-establishments-hero data-partner-hero>
      <div className={s.heroCopy}>
        <span className={s.eyebrow}>ANGELCARE · PARTNER OS</span>
        <h1 tabIndex={-1}>
          {t("VOTRE ÉCOLE.")}
          <br />
          {t("UNE SEULE")}
          <br />
          <em>{t("DYNAMIQUE.")}</em>
        </h1>
        <p>
          {t(
            "Pilotez votre établissement. Reliez vos équipes. Faites avancer vos projets.",
          )}
        </p>
        <div className={s.actions}>
          <button
            className={s.primary}
            onClick={() =>
              onContact({ subject: t("Préparer ma démonstration Partner OS") })
            }
          >
            {t("Préparer ma démonstration")}
            <ArrowRight size={18} />
          </button>
          <button className={s.secondary} onClick={onExplore}>
            {t("Explorer les solutions")}
            <ArrowDown size={16} />
          </button>
        </div>
        <div className={s.heroChips}>
          {["Direction", "Admissions", "Équipes", "Revenus"].map((label) => (
            <span key={label}>
              <Check size={12} />
              {t(label)}
            </span>
          ))}
        </div>
      </div>
      <div className={s.heroScene}>
        <PartnerPhoto hero />
        <div className={s.heroTags}>
          {(
            [
              [Building2, "Direction"],
              [FileCheck2, "Admissions"],
              [Network, "Votre réseau"],
            ] as const
          ).map(([Icon, label]) => (
            <span key={label}>
              <Icon size={20} />
              {t(label)}
            </span>
          ))}
        </div>
        <small>{t("Aperçu illustratif · périmètre à définir")}</small>
      </div>
      <div className={s.promiseRibbon}>
        {(
          [
            [Building2, "Une sous-application par établissement"],
            [Layers3, "Des modules selon vos besoins"],
            [Network, "Un pilotage multi-sites"],
            [HeartHandshake, "Un accompagnement à définir"],
          ] as const
        ).map(([Icon, label]) => (
          <span key={label}>
            <Icon size={23} />
            {t(label)}
          </span>
        ))}
      </div>
    </section>
  );
}
type Props = {
  request: PartnerRequest;
  onRequest: Dispatch<SetStateAction<PartnerRequest>>;
  onContact: (intent: ContactIntent) => void;
  onExplore: () => void;
  onReview: () => void;
  storageScope: string;
  motion: boolean;
};
function Capability({
  id,
  request,
  toggle,
  open,
  expanded,
  onExpand,
  onContact,
  recommended: highlight,
}: {
  id: ModuleKey;
  request: PartnerRequest;
  toggle: (id: ModuleKey) => void;
  open: (id: ModuleKey) => void;
  expanded: boolean;
  onExpand: () => void;
  onContact: (id: ModuleKey) => void;
  recommended: boolean;
}) {
  const { t } = usePartner();
  const m = moduleByKey(id),
    Icon = ICONS[id],
    selected = request.modules.includes(id);
  const [related, setRelated] = useState<ModuleKey | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <article
      className={s.capability}
      id={`pos-module-${id}`}
      data-partner-module={id}
      data-selected={selected}
      data-recommended={highlight}
    >
      <div className={s.capabilityTop}>
        <span className={s.moduleIcon}>
          <Icon size={22} />
        </span>
        <span className={s.badge}>
          {t(
            selected
              ? "Dans votre brief"
              : highlight
                ? "Pour votre situation"
                : m.tag,
          )}
        </span>
        <button
          className={s.add}
          aria-label={
            t(selected ? "Retirer du brief" : "Ajouter au brief") +
            " · " +
            t(m.label)
          }
          aria-pressed={selected}
          onClick={() => toggle(id)}
        >
          {selected ? <Check size={17} /> : <Plus size={17} />}
        </button>
      </div>
      <h3 tabIndex={-1}>{t(m.label)}</h3>
      <p>{t(m.summary)}</p>
      <ul className={s.benefits}>
        {m.benefits.map((b) => (
          <li key={b}>
            <Check size={14} />
            <span>{t(b)}</span>
          </li>
        ))}
      </ul>
      <div className={s.useTags} aria-label={t("Usages") + " · " + t(m.label)}>
        {m.uses.map((u) => (
          <span key={u}>{t(u)}</span>
        ))}
      </div>
      <div className={s.moduleActions}>
        <button onClick={() => onContact(id)}>
          {t("Préparer ce domaine")}
          <ArrowRight size={14} />
        </button>
        <button
          onClick={onExpand}
          aria-expanded={expanded}
          aria-controls={`pos-detail-${id}`}
        >
          {t("Comprendre & préparer")}
          <ChevronDown size={14} />
        </button>
      </div>
      {expanded && (
        <div className={s.explanation} id={`pos-detail-${id}`}>
          <p>{t(m.detail)}</p>
          <strong>{t("Ce que nous préparons ensemble")}</strong>
          <p>{t(m.prepare)}</p>
          <small>
            {t("Périmètre et conditions à préciser avant engagement.")}
          </small>
        </div>
      )}
      <div className={s.related}>
        <small>{t("À relier selon votre projet")}</small>
        <div>
          {m.related.map((key) => (
            <button
              key={key}
              ref={related === key ? trigger : undefined}
              aria-expanded={related === key}
              aria-controls={`pos-related-${id}`}
              onClick={() => setRelated(related === key ? null : key)}
            >
              {t(moduleByKey(key).label)}
              <Plus size={10} />
            </button>
          ))}
        </div>
      </div>
      {related && (
        <div
          id={`pos-related-${id}`}
          className={s.relatedAnswer}
          role="region"
          aria-label={
            t("Solution associée") + " · " + t(moduleByKey(related).label)
          }
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setRelated(null);
              trigger.current?.focus();
            }
          }}
        >
          <button
            className={s.closeInline}
            aria-label={t("Fermer cette explication")}
            onClick={() => {
              setRelated(null);
              trigger.current?.focus();
            }}
          >
            <X size={14} />
          </button>
          <strong>{t(moduleByKey(related).label)}</strong>
          <p>{t(moduleByKey(related).summary)}</p>
          <div>
            <button onClick={() => toggle(related)}>
              {t(
                request.modules.includes(related)
                  ? "Retirer du brief"
                  : "Associer au brief",
              )}
              <Plus size={12} />
            </button>
            <button onClick={() => open(related)}>
              {t("Voir ce domaine")}
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
type SceneProps = {
  open: (key: ModuleKey) => void;
  presentation: PartnerPresentation;
  onPresentation: Dispatch<SetStateAction<PartnerPresentation>>;
};
function AdmissionsScene({ open, presentation, onPresentation }: SceneProps) {
  const { t } = usePartner();
  const step = presentation.admissions;
  const setStep = (admissions: number) =>
    onPresentation((value) => ({ ...value, admissions }));
  const steps = [
    {
      label: "Premier contact",
      title: "Chaque demande mérite un suivi préparé.",
      text: "Retrouvez le contact, son besoin et la prochaine étape utile.",
      ids: ["crm", "communication"],
    },
    {
      label: "Visite",
      title: "Votre accueil raconte déjà votre qualité.",
      text: "Préparez la visite, les informations à partager et les échanges à poursuivre.",
      ids: ["admissions", "crm"],
    },
    {
      label: "Inscription",
      title: "Des étapes lisibles. Un dossier suivi.",
      text: "Reliez les pièces, les validations et les conditions de l’inscription.",
      ids: ["admissions", "documents"],
    },
    {
      label: "Vie de l’école",
      title: "Une relation qui continue après l’inscription.",
      text: "Organisez les informations, les échanges et la continuité avec les familles.",
      ids: ["parents", "communication"],
    },
  ] as const;
  return (
    <div className={s.admissionsStudio}>
      <div className={s.admissionsCopy}>
        <div
          className={s.stageTabs}
          role="group"
          aria-label={t("Parcourir la relation familles")}
        >
          {steps.map((stage, i) => (
            <button
              key={stage.label}
              aria-pressed={step === i}
              onClick={() => setStep(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {t(stage.label)}
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
        <div className={s.stageExplanation} aria-live="polite">
          <span className={s.eyebrow}>{t("Un parcours relié")}</span>
          <h3>{t(steps[step].title)}</h3>
          <p>{t(steps[step].text)}</p>
          <div className={s.useTags}>
            {steps[step].ids.map((key) => (
              <button key={key} onClick={() => open(key)}>
                {t(moduleByKey(key).label)}
                <Plus size={12} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={s.scenePhoto}>
        <PartnerPhoto kind="parents" />
        <span className={s.photoLabel}>
          {t("Relation famille · du premier échange au quotidien")}
        </span>
      </div>
    </div>
  );
}
function PlanningScene({ open, presentation, onPresentation }: SceneProps) {
  const { t } = usePartner();
  const mode = presentation.planning;
  const setMode = (planning: number) =>
    onPresentation((value) => ({ ...value, planning }));
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
  const tabs = [
    {
      label: "Planifier",
      title: "Le bon repère, avant le début de la journée.",
      text: "Activités, groupes, espaces et ressources : préparez une lecture commune.",
      items: [
        "Éveil musical",
        "Motricité",
        "Ateliers créatifs",
        "Jardin et nature",
        "Temps collectif",
      ],
    },
    {
      label: "Coordonner",
      title: "Des responsabilités visibles. Des passages préparés.",
      text: "Reliez les intervenants et les ressources à chaque moment du programme.",
      items: [
        "Accueil équipe",
        "Préparation classe",
        "Répartition des rôles",
        "Point de coordination",
        "Transmission",
      ],
    },
    {
      label: "Suivre",
      title: "Un suivi partagé, pour préparer la suite.",
      text: "Retrouvez les actions, les observations et les ajustements à examiner.",
      items: [
        "Retour équipe",
        "Points à suivre",
        "Ressources à prévoir",
        "Échanges familles",
        "Prochaines étapes",
      ],
    },
  ] as const;
  return (
    <div className={s.planningStudio}>
      <div className={s.scenePhoto}>
        <PartnerPhoto kind="activities" />
        <div className={s.plannerOverlay}>
          <strong>
            <CalendarDays size={16} />
            {t("Exemple de semaine")}
          </strong>
          {days.map((day, i) => (
            <div key={day}>
              <span>{t(day)}</span>
              <span>{t(tabs[mode].items[i])}</span>
            </div>
          ))}
          <small>{t("Projection illustrative")}</small>
        </div>
      </div>
      <div className={s.planningCopy}>
        <div
          className={s.segmented}
          role="group"
          aria-label={t("Comprendre le quotidien")}
        >
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              aria-pressed={mode === i}
              onClick={() => setMode(i)}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
        <h3>{t(tabs[mode].title)}</h3>
        <p>{t(tabs[mode].text)}</p>
        <div className={s.practicalSteps}>
          {["Préparer", "Transmettre", "Suivre"].map((label, i) => (
            <div key={label}>
              <span>0{i + 1}</span>
              <strong>{t(label)}</strong>
              <p>
                {t(
                  [
                    "Choisir les activités et les ressources.",
                    "Partager les informations utiles à l’équipe.",
                    "Examiner les observations et les ajustements.",
                  ][i],
                )}
              </p>
            </div>
          ))}
        </div>
        <button
          className={s.textButton}
          onClick={() => open(mode === 1 ? "operations" : "planning")}
        >
          {t("Comprendre ce domaine")}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
function TeamScene({ open, presentation, onPresentation }: SceneProps) {
  const { t } = usePartner();
  const topic = presentation.team;
  const setTopic = (team: PartnerPresentation["team"]) =>
    onPresentation((value) => ({ ...value, team }));
  return (
    <div className={s.teamStudio}>
      <div className={s.scenePhoto}>
        <PartnerPhoto kind="team" />
        <span className={s.photoLabel}>
          {t("Une pratique commune, des responsabilités claires")}
        </span>
      </div>
      <div className={s.teamWorkbench}>
        <span className={s.eyebrow}>{t("Le collectif se prépare")}</span>
        <h3>{t("Recruter. Transmettre. Faire progresser.")}</h3>
        <div
          className={s.teamTabs}
          role="group"
          aria-label={t("Parcourir les besoins de l’équipe")}
        >
          {(["rh", "formation", "qualite", "roles"] as const).map((key) => {
            const Icon = ICONS[key];
            return (
              <button
                key={key}
                aria-pressed={topic === key}
                onClick={() => setTopic(key)}
              >
                <Icon size={17} />
                {t(moduleByKey(key).label)}
              </button>
            );
          })}
        </div>
        <div className={s.teamAnswer} aria-live="polite">
          <strong>{t(moduleByKey(topic).summary)}</strong>
          <p>{t(moduleByKey(topic).prepare)}</p>
          <button className={s.textButton} onClick={() => open(topic)}>
            {t("Comprendre ce domaine")}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
function FinanceScene({ open, presentation, onPresentation }: SceneProps) {
  const { t } = usePartner();
  const step = presentation.finance;
  const setStep = (finance: PartnerPresentation["finance"]) =>
    onPresentation((value) => ({ ...value, finance }));
  return (
    <div className={s.financeStudio}>
      <div className={s.financeVisual}>
        <PartnerPhoto kind="finance" />
        <div>
          <span className={s.eyebrow}>{t("De l’offre à l’encaissement")}</span>
          <strong>{t("Un parcours commercial qui garde son contexte.")}</strong>
        </div>
      </div>
      <div
        className={s.financeFlow}
        role="group"
        aria-label={t("Parcourir le suivi commercial")}
      >
        {(["plans", "services", "facturation", "paiements"] as const).map(
          (key, i) => {
            const Icon = ICONS[key];
            return (
              <button
                key={key}
                aria-pressed={step === key}
                onClick={() => setStep(key)}
              >
                <span>0{i + 1}</span>
                <Icon size={24} />
                <strong>{t(moduleByKey(key).label)}</strong>
                <small>{t(moduleByKey(key).summary)}</small>
              </button>
            );
          },
        )}
      </div>
      <div className={s.financeAnswer} aria-live="polite">
        <div>
          <span>{t("Des suivis séparés")}</span>
          <p>
            {t(
              "Des informations à rapprocher entre l’offre, la facturation et les règlements.",
            )}
          </p>
        </div>
        <ArrowRight size={22} />
        <div>
          <strong>{t("Un parcours relié")}</strong>
          <p>{t(moduleByKey(step).prepare)}</p>
        </div>
        <button className={s.secondary} onClick={() => open(step)}>
          {t("Voir ce domaine")}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
export function PartnerJourney({
  request,
  onRequest: setRequest,
  onContact,
  onExplore,
  onReview,
  storageScope,
  motion,
}: Props) {
  const { locale, t } = usePartner();
  const root = useRef<HTMLDivElement>(null),
    briefTrigger = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState<ChapterKey>("direction"),
    [briefOpen, setBriefOpen] = useState(false),
    [top, setTop] = useState(214),
    [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useSessionValue<ModuleKey[]>(
    `ac.partner.details.v1:${storageScope}`,
    [],
    (v) =>
      MODULES.filter((m) => Array.isArray(v) && v.includes(m.key)).map(
        (m) => m.key,
      ),
  );
  const [presentation, setPresentation] = useSessionValue(
    `ac.partner.presentation.v1:${storageScope}`,
    EMPTY_PRESENTATION,
    restorePresentation,
  );
  const { pain, all } = presentation;
  const setPain = (pain: number) =>
    setPresentation((value) => ({ ...value, pain }));
  const setAll = (all: boolean) =>
    setPresentation((value) => ({ ...value, all }));
  const onRequest = useCallback<Dispatch<SetStateAction<PartnerRequest>>>(
    (value) => {
      if (document.querySelector('#world-enquiry form[aria-busy="true"]'))
        return;
      setRequest(value);
    },
    [setRequest],
  );
  const suggestions = recommended(request);
  const toggle = (key: ModuleKey) => {
    if (document.querySelector('#world-enquiry form[aria-busy="true"]')) return;
    onRequest((r) => toggleModule(r, key));
    setNotice(
      t(request.modules.includes(key) ? "Retiré du brief" : "Ajouté au brief") +
        " · " +
        t(moduleByKey(key).label),
    );
  };
  const open = useCallback(
    (key: ModuleKey) => {
      setExpanded((before) =>
        before.includes(key) ? before : [...before, key],
      );
      setActive(chapterFor(key).key);
      const id = `pos-module-${key}`;
      history.pushState(
        null,
        "",
        `${location.pathname}${location.search}#partner-os/${id}`,
      );
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({
          block: "start",
          behavior: motion ? "smooth" : "instant",
        });
        el?.querySelector<HTMLElement>("h3")?.focus({ preventScroll: true });
      });
    },
    [motion, setExpanded],
  );
  const contactModule = (key: ModuleKey) => {
    onRequest((r) =>
      r.modules.includes(key) ? r : { ...r, modules: [...r.modules, key] },
    );
    onContact({
      subject: t("Préparer ce domaine") + " · " + t(moduleByKey(key).label),
    });
  };
  const contactChapter = (chapter: (typeof CHAPTERS)[number]) => {
    onRequest((r) => ({ ...r, priority: chapter.label }));
    onContact({ subject: t(chapter.cta) });
  };
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(
      "[data-establishments-nav]",
    );
    if (!nav) return;
    const read = () =>
      setTop(
        (parseFloat(getComputedStyle(nav).top) || 140) +
          nav.getBoundingClientRect().height,
      );
    read();
    const observer = new ResizeObserver(read);
    observer.observe(nav);
    window.addEventListener("resize", read);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", read);
    };
  }, []);
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      let current: ChapterKey = "direction";
      for (const chapter of CHAPTERS) {
        const el = document.getElementById(`pos-${chapter.key}`);
        if (el && el.getBoundingClientRect().top <= top + 125)
          current = chapter.key;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [top]);
  useEffect(() => {
    const read = () => {
      const key = location.hash.split("/")[1]?.replace(/^pos-module-/, "");
      if (MODULES.some((m) => m.key === key)) {
        setExpanded((before) =>
          before.includes(key as ModuleKey)
            ? before
            : [...before, key as ModuleKey],
        );
        setActive(chapterFor(key as ModuleKey).key);
      }
    };
    read();
    window.addEventListener("popstate", read);
    window.addEventListener("hashchange", read);
    return () => {
      window.removeEventListener("popstate", read);
      window.removeEventListener("hashchange", read);
    };
  }, [setExpanded]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  const painPoints = [
    {
      question: "Trop d’informations dispersées ?",
      answer: "Relier les données. Retrouver vos priorités.",
      copy: "Un environnement unifié pour piloter, communiquer et préparer vos prochaines étapes.",
      keys: ["direction", "reporting", "documents"],
    },
    {
      question: "Des échanges familles difficiles à suivre ?",
      answer: "Un contact. Une histoire. Une prochaine étape.",
      copy: "Préparez une continuité entre demande, visite, inscription et communication.",
      keys: ["crm", "admissions", "communication"],
    },
    {
      question: "Des équipes à coordonner ?",
      answer: "Des rôles lisibles. Un quotidien préparé.",
      copy: "Reliez plannings, responsabilités et transmission des pratiques.",
      keys: ["rh", "planning", "formation"],
    },
  ] as const;
  return (
    <div
      ref={root}
      className={s.journey}
      data-partner-journey="R2"
      style={{ "--pos-top": `${top}px` } as CSSProperties}
      dir={locale === "ar" ? "rtl" : "ltr"}
      onKeyDown={(e) => {
        if (e.key === "Escape" && briefOpen) {
          setBriefOpen(false);
          briefTrigger.current?.focus();
        }
      }}
    >
      <div className={s.stickyJourney}>
        <nav aria-label={t("Parcourir Partner OS")}>
          <a href="#partner-os/pos-priorities" className={s.journeyBrand}>
            <Compass size={18} />
            <span>
              {t("Mon parcours Partner OS")}
              <small>
                {t("Avancez selon votre situation et vos priorités.")}
              </small>
            </span>
          </a>
          <div className={s.chapterLinks}>
            {CHAPTERS.map((chapter) => {
              const Icon = CHAPTER_ICONS[chapter.key];
              return (
                <a
                  key={chapter.key}
                  href={`#partner-os/pos-${chapter.key}`}
                  aria-current={active === chapter.key ? "location" : undefined}
                >
                  <Icon size={15} />
                  {t(chapter.label)}
                  {chapter.modules.some((key) =>
                    request.modules.includes(key),
                  ) && (
                    <i aria-label={t("Comprend une priorité sélectionnée")} />
                  )}
                </a>
              );
            })}
            <a href="#partner-os/pos-project">{t("Mon projet")}</a>
          </div>
          <button
            ref={briefTrigger}
            className={s.briefButton}
            aria-expanded={briefOpen}
            aria-controls="pos-brief-tray"
            onClick={() => setBriefOpen((v) => !v)}
          >
            <Layers3 size={15} />
            {t("Mon brief")}
            <strong>{request.modules.length}</strong>
            <ChevronDown size={13} />
          </button>
        </nav>
        <div className={s.contextLinks}>
          <span>{t(CHAPTERS.find((c) => c.key === active)!.label)}</span>
          {CHAPTERS.find((c) => c.key === active)!.modules.map((key) => (
            <button key={key} onClick={() => open(key)}>
              {t(moduleByKey(key).label)}
            </button>
          ))}
          <button onClick={onExplore}>
            <Search size={12} />
            {t("Catalogue")}
            <ArrowUp size={12} />
          </button>
        </div>
        {briefOpen && (
          <div className={s.briefTray} id="pos-brief-tray">
            <div>
              <strong>{t("Votre périmètre à étudier")}</strong>
              <p>
                {t(
                  "Votre sélection prépare un échange. Elle ne constitue pas une commande.",
                )}
              </p>
            </div>
            <div className={s.selectedChips}>
              {request.modules.map((key) => (
                <button
                  key={key}
                  onClick={() => toggle(key)}
                  aria-label={
                    t("Retirer du brief") + " · " + t(moduleByKey(key).label)
                  }
                >
                  {t(moduleByKey(key).label)}
                  <X size={12} />
                </button>
              ))}
              {!request.modules.length && (
                <p>
                  {t(
                    "Choisissez vos domaines ou laissez-nous vous aider à préciser vos priorités.",
                  )}
                </p>
              )}
            </div>
            <div className={s.actions}>
              <button
                className={s.textButton}
                disabled={!request.modules.length}
                onClick={() => onRequest((r) => ({ ...r, modules: [] }))}
              >
                {t("Retirer tous les domaines")}
                <X size={12} />
              </button>
              <button className={s.secondary} onClick={onReview}>
                {t("Revoir les offres sélectionnées")}
              </button>
              <button
                className={s.primary}
                onClick={() =>
                  onContact({
                    subject: t("Préparer ma démonstration Partner OS"),
                  })
                }
              >
                {t("Préparer mon échange")}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
      <section
        className={s.orientation}
        id="pos-priorities"
        data-partner-section="priorities"
      >
        <div className={s.situationRow}>
          <strong>{t("Votre situation")}</strong>
          {SITUATIONS.map((value) => (
            <button
              key={value}
              aria-pressed={request.situation === value}
              onClick={() => onRequest((r) => ({ ...r, situation: value }))}
            >
              {t(value)}
            </button>
          ))}
          <span>{t("Votre sélection reste libre.")}</span>
        </div>
        <div className={s.orientationGrid}>
          <div
            className={s.painChoices}
            role="group"
            aria-label={t("Choisir votre priorité")}
          >
            {painPoints.map((point, i) => (
              <button
                key={point.question}
                aria-pressed={pain === i}
                onClick={() => setPain(i)}
              >
                <HeartHandshake size={21} />
                <strong>{t(point.question)}</strong>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
          <div className={s.painAnswer} aria-live="polite">
            <span className={s.eyebrow}>
              {t("Ce qui change dans votre quotidien")}
            </span>
            <h2>{t(painPoints[pain].answer)}</h2>
            <p>{t(painPoints[pain].copy)}</p>
            <div className={s.useTags}>
              {painPoints[pain].keys.map((key) => (
                <button key={key} onClick={() => open(key)}>
                  {t(moduleByKey(key).label)}
                  <ArrowRight size={12} />
                </button>
              ))}
            </div>
          </div>
          <div className={s.orientationPromise}>
            <Monitor size={30} />
            {[
              "Une vision claire et partagée",
              "Un quotidien mieux organisé",
              "Des actions préparées et connectées",
            ].map((v) => (
              <span key={v}>
                <Check size={15} />
                {t(v)}
              </span>
            ))}
            <small>{t("Des objectifs à examiner selon votre projet.")}</small>
          </div>
        </div>
        <div className={s.suggested}>
          <span>
            <Compass size={16} />
            {t("Points de départ pour votre situation")}
          </span>
          {suggestions.map((key) => (
            <button key={key} onClick={() => open(key)}>
              {t(moduleByKey(key).label)}
              <Plus size={10} />
            </button>
          ))}
          <button
            onClick={() =>
              onRequest((r) => ({
                ...r,
                modules: [...new Set([...r.modules, ...suggestions])],
              }))
            }
          >
            {t("Ajouter ces priorités au brief")}
            <Plus size={13} />
          </button>
        </div>
      </section>
      <div className={s.readingControls}>
        <span>
          <BookOpen size={16} />
          {t("Choisissez votre rythme de lecture")}
        </span>
        <button
          aria-pressed={!all && !expanded.length}
          onClick={() => {
            setAll(false);
            setExpanded([]);
          }}
        >
          {t("L’essentiel")}
        </button>
        <button aria-pressed={all} onClick={() => setAll(true)}>
          {t("Toutes les explications")}
        </button>
      </div>
      {CHAPTERS.map((chapter, index) => (
        <section
          key={chapter.key}
          id={`pos-${chapter.key}`}
          data-partner-section={chapter.key}
          className={s.chapter}
          data-chapter={chapter.key}
        >
          <header className={s.chapterHeader}>
            <div>
              <span className={s.eyebrow}>
                {String(index + 1).padStart(2, "0")} · {t(chapter.label)}
              </span>
              <h2>{t(chapter.title)}</h2>
            </div>
            <div>
              <p>{t(chapter.lead)}</p>
              <span className={s.badge}>{t("Périmètre à définir")}</span>
            </div>
          </header>
          <PartnerR2WorldLead
            chapter={chapter.key}
            onOpen={open}
            onAdd={toggle}
            selected={request.modules}
          />
          {chapter.key === "direction" && (
            <div className={s.directionScene}>
              <PartnerPhoto />
              <div className={s.directionSpots}>
                {(["direction", "sites", "reporting"] as const).map(
                  (key, i) => (
                    <button key={key} onClick={() => open(key)}>
                      <b>{i + 1}</b>
                      {t(
                        [
                          "Vue d’ensemble de l’établissement",
                          "Lecture par site",
                          "Priorités partagées",
                        ][i],
                      )}
                      <Plus size={13} />
                    </button>
                  ),
                )}
              </div>
              <div className={s.directionCaption}>
                <span className={s.eyebrow}>{t("Votre lecture commune")}</span>
                <strong>
                  {t("La bonne information, au moment de décider.")}
                </strong>
                <p>
                  {t(
                    "Des repères pour la direction, les sites et les équipes.",
                  )}
                </p>
              </div>
              <small>{t("Aperçu illustratif")}</small>
            </div>
          )}
          {chapter.key === "familles" && (
            <AdmissionsScene
              open={open}
              presentation={presentation}
              onPresentation={setPresentation}
            />
          )}
          {chapter.key === "quotidien" && (
            <PlanningScene
              open={open}
              presentation={presentation}
              onPresentation={setPresentation}
            />
          )}
          {chapter.key === "equipes" && (
            <TeamScene
              open={open}
              presentation={presentation}
              onPresentation={setPresentation}
            />
          )}
          {chapter.key === "revenus" && (
            <FinanceScene
              open={open}
              presentation={presentation}
              onPresentation={setPresentation}
            />
          )}
          {chapter.key === "ecosysteme" && (
            <div className={s.ecosystemStudio}>
              <div className={s.ecosystemWheel}>
                <div className={s.ecosystemCenter}>
                  <Monitor size={30} />
                  ANGELCARE
                  <br />
                  PARTNER OS
                </div>
                {CHAPTERS.map((ch) => (
                  <a key={ch.key} href={`#partner-os/pos-${ch.key}`}>
                    {t(ch.label)}
                  </a>
                ))}
              </div>
              <div className={s.directory}>
                <h3>{t("Les 20 domaines de Partner OS")}</h3>
                <p>
                  {t(
                    "Un même environnement, un périmètre adapté à votre établissement.",
                  )}
                </p>
                <div>
                  {MODULES.map((m) => (
                    <button key={m.key} onClick={() => open(m.key)}>
                      <Check size={12} />
                      <span>{t(m.label)}</span>
                      <Plus size={11} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <PartnerR2ModuleSwitcher
            chapter={chapter.key}
            items={chapter.modules}
            render={(key)=>(
              <Capability
                key={key}
                id={key}
                request={request}
                toggle={toggle}
                open={open}
                expanded={all || expanded.includes(key)}
                onExpand={() => {
                  if(all){
                    setAll(false);
                    setExpanded(MODULES.filter(m=>m.key!==key).map(m=>m.key));
                  }else{
                    setExpanded(before=>before.includes(key)?before.filter(k=>k!==key):[...before,key]);
                  }
                }}
                onContact={contactModule}
                recommended={suggestions.includes(key)}
              />
            )}
          />
          {chapter.key === "ecosysteme" && (
            <div className={s.ecosystemBenefits}>
              {[
                "Activer selon le besoin",
                "Préciser les responsabilités",
                "Relier les documents",
                "Préparer l’accompagnement",
              ].map((v, i) => (
                <div key={v}>
                  <Link2 size={19} />
                  <span>
                    <strong>{t(v)}</strong>
                    <small>
                      {t(
                        [
                          "Adapter le périmètre à vos usages.",
                          "Définir les rôles et les accès utiles.",
                          "Retrouver le contexte et les pièces.",
                          "Convenir des modalités de suivi.",
                        ][i],
                      )}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          )}
          <footer className={s.chapterFooter}>
            <span>
              <CheckCheck size={15} />
              {t("Votre projet se construit selon vos priorités.")}
            </span>
            <button onClick={onExplore}>
              {t("Revoir les offres publiées")}
              <ArrowUp size={13} />
            </button>
            <button
              className={s.primary}
              onClick={() => contactChapter(chapter)}
            >
              {t(chapter.cta)}
              <ArrowRight size={16} />
            </button>
          </footer>
        </section>
      ))}
      <PartnerR2Atlas
        selected={request.modules}
        onOpen={open}
        onAdd={toggle}
      />
      <section
        className={s.projectComposer}
        id="pos-project"
        data-partner-section="project"
      >
        <div className={s.projectIntro}>
          <span className={s.eyebrow}>
            {t("Modulable · selon votre projet")}
          </span>
          <h2>
            {t("Un même environnement.")}
            <br />
            <em>{t("Votre propre périmètre.")}</em>
          </h2>
          <p>
            {t(
              "Définissez vos priorités, sélectionnez vos domaines et préparez votre démonstration autour de vos cas d’usage.",
            )}
          </p>
        </div>
        <PartnerR2ProjectMap
          request={request}
          onAdd={toggle}
          onOpen={open}
          onContact={() => onContact({subject:t("Préparer ma démonstration Partner OS")})}
        />
        <div className={s.projectSteps}>
          {[
            "Vos priorités",
            "Votre périmètre",
            "Votre démonstration",
            "Votre proposition",
          ].map((v, i) => (
            <div key={v}>
              <b>{i + 1}</b>
              <span>
                <strong>{t(v)}</strong>
                <small>
                  {t(
                    [
                      "Identifier vos besoins et votre situation.",
                      "Définir les domaines à explorer.",
                      "Préparer les questions et les usages.",
                      "Examiner les conditions avant engagement.",
                    ][i],
                  )}
                </small>
              </span>
            </div>
          ))}
        </div>
        <div className={s.composerSelected}>
          <strong>{t("Mon brief préparé · facultatif")}</strong>
          <div className={s.selectedChips}>
            {request.modules.length
              ? request.modules.map((key) => (
                  <button key={key} onClick={() => toggle(key)}>
                    {t(moduleByKey(key).label)}
                    <X size={12} />
                  </button>
                ))
              : CHAPTERS.map((ch) => (
                  <button key={ch.key} onClick={() => open(ch.modules[0])}>
                    {t(ch.label)}
                    <Plus size={12} />
                  </button>
                ))}
          </div>
          <div className={s.actions}>
            <button className={s.secondary} onClick={onReview}>
              {t("Revoir les offres sélectionnées")}
            </button>
            <button
              className={s.primary}
              onClick={() =>
                onContact({
                  subject: t("Préparer ma démonstration Partner OS"),
                })
              }
            >
              {t("Préparer mon échange")}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
      <section className={s.faq} data-partner-section="questions">
        <div>
          <span className={s.eyebrow}>{t("Avant de décider")}</span>
          <h2>{t("Vos questions font partie du projet.")}</h2>
          <p>
            {t("Un périmètre clair. Les bonnes informations au bon moment.")}
          </p>
        </div>
        <div>
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>
                {t(q)}
                <Plus size={14} />
              </summary>
              <p>{t(a)}</p>
            </details>
          ))}
        </div>
      </section>
      <div className={s.finalBar}>
        <div>
          <span className={s.eyebrow}>
            {t("Vos priorités préparent le prochain échange")}
          </span>
          <strong>
            {t("Votre établissement. Vos usages. Votre Partner OS.")}
          </strong>
        </div>
        <button
          className={s.primary}
          onClick={() =>
            onContact({ subject: t("Préparer ma démonstration Partner OS") })
          }
        >
          {t("Passer à ma demande")}
          <ArrowDown size={16} />
        </button>
        <button className={s.textButton} onClick={onExplore}>
          {t("Revoir le catalogue")}
          <ArrowUp size={14} />
        </button>
      </div>
      <PartnerR2MobileNav
        selected={request.modules.length}
        onExplore={onExplore}
        onWorlds={() => document.getElementById("pos-direction")?.scrollIntoView({block:"start",behavior:motion?"smooth":"instant"})}
        onAtlas={() => document.getElementById("pos-atlas")?.scrollIntoView({block:"start",behavior:motion?"smooth":"instant"})}
        onProject={() => document.getElementById("pos-project")?.scrollIntoView({block:"start",behavior:motion?"smooth":"instant"})}
      />
      <p className={s.notice} role="status" aria-live="polite">
        {notice}
      </p>
    </div>
  );
}
export function PartnerBriefFields({
  request,
  onRequest,
}: {
  request: PartnerRequest;
  onRequest: Dispatch<SetStateAction<PartnerRequest>>;
}) {
  const { t } = usePartner();
  const select = (
    key: "situation" | "priority" | "sites" | "horizon",
    label: string,
    options: readonly string[],
  ) => (
    <label key={key}>
      <span>{t(label)}</span>
      <select
        aria-label={t(label)}
        value={request[key]}
        onChange={(e) => {
          const value = e.target.value;
          onRequest((r) => ({ ...r, [key]: value }));
        }}
      >
        {options.map((v) => (
          <option key={v} value={v}>
            {t(v)}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className={s.briefFields}>
      <div className={s.formTopics}>
        <strong>{t("Vos priorités sont déjà dans le brief.")}</strong>
        <div className={s.selectedChips}>
          {request.modules.map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => onRequest((r) => toggleModule(r, key))}
              aria-label={
                t("Retirer du brief") + " · " + t(moduleByKey(key).label)
              }
            >
              {t(moduleByKey(key).label)}
              <X size={11} />
            </button>
          ))}
          <details>
            <summary>
              <Plus size={12} />
              {t("Ajouter ou ajuster les domaines")}
            </summary>
            <div className={s.formModules}>
              {MODULES.map((m) => (
                <button
                  type="button"
                  key={m.key}
                  aria-pressed={request.modules.includes(m.key)}
                  onClick={() => onRequest((r) => toggleModule(r, m.key))}
                >
                  {request.modules.includes(m.key) ? (
                    <Check size={13} />
                  ) : (
                    <Plus size={13} />
                  )}
                  <span>{t(m.label)}</span>
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
      <div className={s.briefSelects}>
        {select("situation", "Votre situation", SITUATIONS)}
        {select("priority", "Votre priorité", PRIORITIES)}
        {select("sites", "Nombre de sites", SITE_COUNTS)}
        {select("horizon", "Votre horizon", HORIZONS)}
      </div>
    </div>
  );
}
