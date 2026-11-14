"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  Accessibility,
  Armchair,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  ClipboardCheck,
  DoorOpen,
  Droplets,
  FolderOpen,
  GraduationCap,
  Layers3,
  MessagesSquare,
  Network,
  PartyPopper,
  PencilRuler,
  Search,
  Shapes,
  ShieldCheck,
  Shirt,
  Signpost,
  Sparkles,
  X,
} from "lucide-react";
import { JourneyLink } from "./JourneyLink";
import { ModuleIcon } from "./JourneyEditorial";
import { VIEWS, type Module, type View } from "./content";
import {
  findJourney,
  journeyIndex,
  type JourneyResult,
} from "./journey-search";
import { requestBrief, type Selection } from "./model";
import { Pagination } from "./ExplorerControls";
import type { DiscoveryItem } from "../catalog-discovery/types";
import p from "./premium.module.css";

export function HeroExhibit({ view }: { view: View }) {
  const labels =
    view === "conseil"
      ? ["Expérience enfant", "Pratiques d’équipe", "Confiance parents"]
      : view === "partner-os"
        ? ["Admissions & familles", "Équipes & opérations", "Pilotage & suivi"]
        : [
            "Identité & accueil",
            "Espaces & pédagogie",
            "Équipe & organisation",
          ];
  return (
    <div className={p.exhibit}>
      <div className={p.exhibitTop}>
        <span>
          <Sparkles size={13} />{" "}
          {view === "partner-os"
            ? "Partner OS · votre point de départ"
            : "L’ambition prend forme"}
        </span>
        <b>
          {view === "partner-os"
            ? "12 mois gratuits"
            : view === "produits"
              ? "16 univers"
              : "3 leviers"}
        </b>
      </div>
      <div className={p.exhibitBottom}>
        <span className={p.exhibitSeal}>
          <Layers3 size={24} />
          <strong>
            {view === "conseil"
              ? "CONSTRUIRE"
              : view === "produits"
                ? "HARMONISER"
                : "CONNECTER"}
          </strong>
          <small>Votre établissement, ensemble.</small>
        </span>
        <div>
          {labels.map((label, i) => (
            <span key={label}>
              <i>0{i + 1}</i>
              {label}
              <CheckCircle2 size={14} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
const UNIVERSE_ICONS = [
  DoorOpen,
  Camera,
  Signpost,
  PartyPopper,
  Shapes,
  PencilRuler,
  Armchair,
  Accessibility,
  FolderOpen,
  Droplets,
  ShieldCheck,
  MessagesSquare,
  Shirt,
  GraduationCap,
  ClipboardCheck,
  Network,
];
/** Decorative marks follow the sixteen brochure universes, without adding product claims. */
export function UniverseMark({ index }: { index: number }) {
  const Icon = UNIVERSE_ICONS[index];
  return (
    <span className={p.universeMark} aria-hidden="true">
      <Icon size={25} strokeWidth={1.6} />
      <b>{String(index + 1).padStart(2, "0")}</b>
    </span>
  );
}
const FLOWS: Record<string, string[]> = {
  direction: ["Informations clés", "Priorités", "Décisions"],
  multi: ["Vos sites", "Lecture par établissement", "Coordination"],
  reporting: ["Activité", "Indicateurs", "Lecture partagée"],
  roles: ["Équipe", "Responsabilités", "Accès"],
  admissions: ["Dossier", "Étapes", "Prochaine action"],
  crm: ["Contact", "Rendez-vous", "Suivi"],
  experience: ["Accueil", "Échanges", "Continuité"],
  communication: ["Information", "Message", "Historique"],
  services: ["Besoin", "Service adapté", "Proposition"],
  marketplace: ["Catalogue", "Offre", "Parcours"],
  devis: ["Demande", "Proposition", "Suivi"],
  facturation: ["Facture", "Échéance", "Suivi"],
  rh: ["Équipe", "Organisation", "Coordination"],
  formation: ["Compétence", "Formation", "Pratique"],
  operations: ["Tâche", "Responsable", "Suivi"],
  calendrier: ["Événement", "Planning", "Coordination"],
  paiements: ["Paiement", "Rapprochement", "Suivi"],
  qualite: ["Observation", "Action", "Contrôle"],
  support: ["Demande", "Traitement", "Réponse"],
  documents: ["Document", "Classement", "Accès"],
};
export function ModuleGraphic({
  module,
  large = false,
}: {
  module: Module;
  large?: boolean;
}) {
  return (
    <div
      className={`${p.moduleGraphic} ${large ? p.largeGraphic : ""}`}
      data-group={module.group}
      aria-label={`Parcours illustratif : ${module.title}`}
    >
      <div className={p.graphicTop}>
        <span>
          <i />
          <i />
          <i />
        </span>
        <small>PARTNER OS / {module.group}</small>
        <ModuleIcon group={module.group} id={module.id} />
      </div>
      <div className={p.graphicBody}>
        <div className={p.graphicEmblem}>
          <ModuleIcon group={module.group} id={module.id} />
        </div>
        <div>
          <b>{module.title}</b>
          <span>Une continuité entre vos actions</span>
        </div>
      </div>
      <ol>
        {FLOWS[module.id].map((step, i) => (
          <li key={step}>
            <span>0{i + 1}</span>
            <b>{step}</b>
            {i < 2 && <ArrowRight size={12} />}
          </li>
        ))}
      </ol>
      <small className={p.graphicCaption}>
        Aperçu illustratif · disponibilité selon le plan
      </small>
    </div>
  );
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => prior?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className={p.modal}
      aria-labelledby="ew-premium-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <div>
          <span>ÉTABLISSEMENTS / ANGELCARE</span>
          <h2 id="ew-premium-dialog-title">{title}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer la fenêtre">
          <X size={22} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function JourneyFinder({
  offers,
  onChoose,
  onClose,
}: {
  offers: DiscoveryItem[];
  onChoose: (r: JourneyResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<View | "all">("all");
  const [page, setPage] = useState(1);
  const index = useMemo(() => journeyIndex(offers), [offers]);
  const results = findJourney(index, query, scope);
  const perPage = 12;
  const pages = Math.max(1, Math.ceil(results.length / perPage));
  const safePage = Math.min(page, pages);
  return (
    <Modal title="Quel besoin souhaitez-vous faire avancer ?" onClose={onClose}>
      <div className={p.finderControls}>
        <label>
          <Search size={20} />
          <input
            autoFocus
            maxLength={160}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Admissions, formation, mobilier, parents…"
            aria-label="Chercher dans les trois spécialités"
          />
        </label>
        <div role="group" aria-label="Spécialité à rechercher">
          {[{ key: "all", label: "Tout explorer" }, ...VIEWS].map((v) => (
            <button
              key={v.key}
              aria-pressed={scope === v.key}
              onClick={() => {
                setScope(v.key as View | "all");
                setPage(1);
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        {!query && (
          <div className={p.suggestions} aria-label="Recherches suggérées">
            {[
              "1 an gratuit",
              "Admissions",
              "Formation",
              "Parents",
              "Mobilier",
            ].map((term) => (
              <button
                type="button"
                key={term}
                onClick={() => {
                  setQuery(term);
                  setScope("all");
                  setPage(1);
                }}
              >
                <Search size={12} />
                {term}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className={p.searchCount} role="status">
        {results.length} résultat{results.length > 1 ? "s" : ""}
      </p>
      <div className={p.searchResults}>
        {results
          .slice((safePage - 1) * perPage, safePage * perPage)
          .map((r) => (
            <button
              type="button"
              key={r.key}
              onClick={() => onChoose(r)}
              data-kind={r.type}
            >
              <span className={p.resultIcon}>
                {r.type === "offer" ? (
                  <FileText size={20} />
                ) : (
                  <Layers3 size={20} />
                )}
              </span>
              <span>
                <small>{r.label}</small>
                <strong>{r.title}</strong>
                <span>{r.text}</span>
              </span>
              <ArrowRight size={18} />
            </button>
          ))}
      </div>
      {results.length > perPage && (
        <div className={p.finderPages}>
          <Pagination
            page={safePage}
            pages={pages}
            count={results.length}
            onPage={setPage}
          />
        </div>
      )}
      {!results.length && (
        <p className={p.searchEmpty}>
          Aucun résultat avec ces mots. Essayez un besoin plus large ou une
          autre spécialité.
        </p>
      )}
    </Modal>
  );
}
export function ProjectBoard({
  project,
  view,
  territory,
  remove,
  onClose,
}: {
  project: Selection[];
  view: View;
  territory?: string | null;
  remove: (key: string) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState("");
  const [copying, setCopying] = useState(false);
  async function copy() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(
        requestBrief(view, project, territory),
      );
      setStatus("Votre récapitulatif a été copié.");
    } catch {
      setStatus(
        "Copie indisponible ici. Le récapitulatif reste sélectionnable ci-dessous.",
      );
    } finally {
      setCopying(false);
    }
  }
  return (
    <Modal title="Votre projet, dans son ensemble." onClose={onClose}>
      <div className={p.projectIntro}>
        <div>
          <strong>{project.length} / 8</strong>
          <span>éléments à étudier ensemble</span>
        </div>
        <p>
          Reliez les produits, les programmes et les capacités qui répondent à
          votre besoin. Cette préparation ne constitue ni une commande ni une
          activation.
        </p>
      </div>
      <div className={p.projectList}>
        {project.map((item, i) => (
          <article key={item.key}>
            <b>{String(i + 1).padStart(2, "0")}</b>
            <div>
              <small>
                {item.kind === "offer"
                  ? "Offre publiée"
                  : item.kind === "formula"
                    ? "Formule du catalogue"
                    : item.kind === "module"
                      ? "Capacité Partner OS"
                      : "Intention de projet"}
              </small>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
            <button
              aria-label={`Retirer ${item.title} du récapitulatif`}
              onClick={() => remove(item.key)}
            >
              <X size={18} />
            </button>
          </article>
        ))}
      </div>
      {!project.length && (
        <div className={p.searchEmpty}>
          <Layers3 size={30} />
          <h3>Votre prochain projet commence par une sélection.</h3>
          <p>
            Explorez les formules, les produits ou Partner OS, puis ajoutez les
            éléments à étudier.
          </p>
        </div>
      )}
      <details className={p.brief}>
        <summary>Voir le récapitulatif texte</summary>
        <pre>{requestBrief(view, project, territory)}</pre>
      </details>
      <div className={p.boardActions}>
        <button
          onClick={() => void copy()}
          disabled={copying || !project.length}
        >
          <Copy size={16} />
          Copier mon récapitulatif
        </button>
        <JourneyLink href="#world-enquiry" onClick={onClose}>
          Préparer ma demande
          <ArrowRight size={16} />
        </JourneyLink>
      </div>
      <p className={p.copyStatus} role="status">
        {status}
      </p>
    </Modal>
  );
}
export function ChapterNavigation() {
  return (
    <nav className={p.chapterNav} aria-label="Les quatre chapitres produits">
      {[
        "Identité & accueil",
        "Espaces & pédagogie",
        "Quotidien & familles",
        "Équipe & organisation",
      ].map((label, i) => (
        <JourneyLink key={label} href={`#ew-chapter-${i + 1}`}>
          <span>0{i + 1}</span>
          <strong>{label}</strong>
          <ArrowDown size={16} />
        </JourneyLink>
      ))}
    </nav>
  );
}
export function ExplorerIdentity({
  view,
  count,
}: {
  view: View;
  count: number;
}) {
  return (
    <div className={p.explorerIdentity}>
      <div>
        <span className={p.liveDot} />
        <b>
          {view === "conseil"
            ? "LA BONNE FORMULE. LE BON IMPACT."
            : view === "partner-os"
              ? "VOS BESOINS. VOTRE ÉCOSYSTÈME."
              : "VOTRE SÉLECTION COMMENCE ICI."}
        </b>
      </div>
      <span>
        <Check size={13} />
        {view === "conseil"
          ? "9 formules de référence"
          : view === "partner-os"
            ? "20 capacités à découvrir"
            : `${count} offres dans cette spécialité`}
      </span>
      <span>
        <Layers3 size={13} />
        Comparer · sélectionner · préparer
      </span>
    </div>
  );
}
