"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  Layers3,
  MessageCircle,
  Monitor,
  Package,
  Pause,
  Play,
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
import { EMPTY_ENQUIRY, type EnquiryValues } from "../business-worlds/contract";
import { availabilityLabel } from "../storefront-immersive/contract";
import { useSelections } from "../storefront-immersive/useSelections";
import { JourneyContext } from "./JourneyLink";
import { NativeExplorer, OfferImage } from "./OfferExplorer";
import { ProjectEnquiry } from "./ProjectEnquiry";
import {
  CommercialJourney,
  CampaignImage,
  type ContactIntent,
} from "./CommercialJourney";
import { COMMERCIAL } from "./commercial-content";
import { VIEWS, type View } from "./content";
import {
  blocked,
  offerSelection,
  price,
  requestBrief,
  viewFromHash,
  type Selection,
} from "./model";
import { useProject, useSessionValue } from "./useJourneyState";
import c from "./commercial.module.css";
import s from "./journey.module.css";

const ICONS = { conseil: Building2, "partner-os": Monitor, produits: Package };

/** French body only; the parent route retains ownership of the unchanged shared shell. */
export function EstablishmentsExperience({
  experience,
}: {
  experience: StorefrontExperience;
}) {
  const [view, setView] = useState<View>("conseil");
  const [values, setValues] = useState<EnquiryValues>({ ...EMPTY_ENQUIRY });
  const [subject, setSubject] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  const [review, setReview] = useState(false);
  const [detail, setDetail] = useState<DiscoveryItem | null>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const [systemReduced, setSystemReduced] = useState(false);
  const [motionChoice, setMotionChoice] = useSessionValue(
    "ac.establishments.motion.v3",
    true,
    (value) => value !== false,
  );
  const motion = motionChoice && !systemReduced;
  const root = useRef<HTMLDivElement>(null);
  const { project, dispatch, notice } = useProject(
    experience.items,
    experience.territoryCode,
  );
  const selections = useSelections(experience, experience.items);
  const copy = COMMERCIAL[view];
  const brief = [
    subject ? `Sujet de la demande : ${subject}` : "",
    requestBrief(view, project, experience.territoryCode),
  ]
    .filter(Boolean)
    .join("\n");
  const sourceRoute = `/angelcare-marketplace/fr/establishments${experience.territoryCode ? `?territory=${encodeURIComponent(experience.territoryCode)}` : ""}#${view}`;
  const scrollTo = useCallback(
    (id: string) =>
      document
        .getElementById(id)
        ?.scrollIntoView({
          block: "start",
          behavior: motion ? "smooth" : "instant",
        }),
    [motion],
  );
  const contact = useCallback(
    (intent: ContactIntent) => {
      if (document.querySelector('#world-enquiry form[aria-busy="true"]')) {
        document
          .getElementById("world-enquiry")
          ?.scrollIntoView({ block: "start", behavior: "instant" });
        return;
      }
      setReview(false);
      setDetail(null);
      setSubject(intent.subject.slice(0, 240));
      if (intent.email?.trim())
        setValues((previous) => ({ ...previous, email: intent.email!.trim() }));
      setRequestVersion((previous) => previous + 1);
      history.replaceState(
        null,
        "",
        `${location.pathname}${location.search}#${view}/world-enquiry`,
      );
      requestAnimationFrame(() => {
        scrollTo("world-enquiry");
        document
          .querySelector<HTMLInputElement>(
            '#world-enquiry input[name="organization"]',
          )
          ?.focus({ preventScroll: true });
      });
    },
    [view, scrollTo],
  );
  useEffect(() => {
    const read = () => {
      setView(viewFromHash(location.hash));
      setReview(false);
      setDetail(null);
      const target = location.hash.split("/")[1];
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
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSystemReduced(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => dispatch({ type: "dismiss" }), 7000);
    return () => clearTimeout(timer);
  }, [notice, dispatch]);
  useEffect(() => {
    if (!motion || !("IntersectionObserver" in window)) return;
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
    let frame = 0;
    const read = () => {
      frame = 0;
      const node = root.current;
      if (!node) return;
      const top = node.getBoundingClientRect().top + scrollY;
      const length = Math.max(1, node.offsetHeight - innerHeight);
      if (progress.current)
        progress.current.style.transform = `scaleX(${Math.max(0, Math.min(1, (scrollY - top) / length))})`;
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
  }, [view]);
  function navigate(event: MouseEvent<HTMLAnchorElement>, next: View) {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (next === view) return;
    setView(next);
    setDetail(null);
    setReview(false);
    history.pushState(
      null,
      "",
      `${location.pathname}${location.search}#${next}`,
    );
    requestAnimationFrame(() => {
      root.current?.scrollIntoView({ block: "start", behavior: "instant" });
      root.current?.querySelector("h1")?.focus({ preventScroll: true });
    });
  }
  return (
    <JourneyContext.Provider value={view}>
      <div
        ref={root}
        className={c.world}
        data-establishments-journey="R5"
        data-view={view}
        data-motion={motion ? "on" : "off"}
        onClick={(event) => {
          if (
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          const anchor = (event.target as HTMLElement).closest('a[href^="#"]');
          const id = anchor
            ?.getAttribute("href")
            ?.split("/")
            .at(-1)
            ?.replace(/^#/, "");
          if (!id || !document.getElementById(id)) return;
          event.preventDefault();
          history.pushState(
            null,
            "",
            `${location.pathname}${location.search}#${view}/${id}`,
          );
          scrollTo(id);
        }}
      >
        <nav
          className={c.localNav}
          aria-label="Les trois spécialités Établissements"
        >
          <div className={c.specialities}>
            {VIEWS.map((item) => {
              const Icon = ICONS[item.key];
              return (
                <a
                  key={item.key}
                  href={`#${item.key}`}
                  aria-current={view === item.key ? "page" : undefined}
                  onClick={(event) => navigate(event, item.key)}
                >
                  <Icon size={18} />
                  {item.label}
                </a>
              );
            })}
          </div>
          <div className={c.navUtilities}>
            <button
              onClick={() => scrollTo("ew-native-explorer")}
              title="Revenir aux offres"
            >
              <Package size={16} />
              Les offres
            </button>
            <button onClick={() => setReview(true)}>
              <Layers3 size={16} />
              Ma sélection ({project.length})
            </button>
            <button
              className={c.contactUtility}
              onClick={() => contact({ subject: copy.contact })}
            >
              <MessageCircle size={16} />
              Parlons-en
            </button>
            <button
              aria-label={
                motion ? "Réduire les animations" : "Activer les animations"
              }
              aria-pressed={motion}
              disabled={systemReduced}
              onClick={() => setMotionChoice((previous) => !previous)}
              title={
                systemReduced
                  ? "Mouvement réduit selon votre préférence système"
                  : "Animations"
              }
            >
              {motion ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
          <span
            ref={progress}
            className={c.progress}
            style={{ transform: "scaleX(0)" }}
            aria-hidden="true"
          />
        </nav>
        <section className={c.hero} data-establishments-hero>
          <div className={c.heroImage}>
            <CampaignImage
              name={VIEWS.find((item) => item.key === view)!.image}
              alt={`Campagne illustrative · ${VIEWS.find((item) => item.key === view)!.label}`}
              hero
            />
            <span className={c.heroCaption}>
              <CheckCircle2 size={16} />
              Votre contexte. Vos usages. Votre projet.
            </span>
          </div>
          <div className={c.heroCopy}>
            <span className={c.eyebrow}>{copy.eyebrow}</span>
            <h1 tabIndex={-1}>{copy.title}</h1>
            <p>{copy.lead}</p>
            {view === "partner-os" && (
              <div className={c.freeYear}>
                <strong>1 AN GRATUIT</strong>
                <span>12 mois sur le plan gratuit · périmètre à confirmer</span>
              </div>
            )}
            <div className={c.heroActions}>
              <button
                className={c.primary}
                onClick={() => contact({ subject: copy.contact })}
              >
                {copy.contact}
                <ArrowRight size={17} />
              </button>
              <button
                className={c.secondary}
                onClick={() => scrollTo("ew-native-explorer")}
              >
                Voir les offres
                <ArrowDown size={16} />
              </button>
            </div>
            <div className={c.heroFoot}>
              <span>
                <CheckCircle2 size={14} />
                Des solutions selon votre besoin
              </span>
              <span>
                <MessageCircle size={14} />
                Un échange avant de vous engager
              </span>
            </div>
          </div>
        </section>
        <NativeExplorer
          key={`${experience.territoryCode || "default"}:${view}`}
          experience={experience}
          view={view}
          selected={project.map((item) => item.key)}
          add={(item) => dispatch({ type: "toggle", item })}
          selections={selections}
          onDetail={setDetail}
        />
        <CommercialJourney
          key={view}
          view={view}
          email={values.email}
          onEmail={(email) => setValues((previous) => ({ ...previous, email }))}
          onContact={contact}
          selected={project.map((item) => item.key)}
          onSelect={(item) => dispatch({ type: "toggle", item })}
        />
        <div className={c.enquiry} data-commercial-block="enquiry">
          {subject && (
            <div className={c.selectedSubject}>
              <MessageCircle size={20} />
              <div>
                <small>Sujet préparé pour votre demande</small>
                <strong>{subject}</strong>
              </div>
              <button onClick={() => setSubject("")}>
                <X size={14} />
                Effacer le sujet
              </button>
            </div>
          )}
          <ProjectEnquiry
            view={view}
            brief={brief}
            sourceRoute={sourceRoute}
            values={values}
            onValuesChange={setValues}
            requestVersion={requestVersion}
            hasContext={!!subject || project.length > 0}
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
        {review && (
          <ProjectReview
            project={project}
            brief={brief}
            remove={(key) => dispatch({ type: "remove", key })}
            onClose={() => setReview(false)}
            onContact={() =>
              contact({
                subject:
                  subject ||
                  `Projet · ${VIEWS.find((item) => item.key === view)!.label}`,
              })
            }
          />
        )}
        {detail && (
          <OfferDetail
            item={detail}
            territory={experience.territoryCode}
            selected={project.some((item) => item.key === `offer:${detail.id}`)}
            onSelect={() =>
              dispatch({ type: "toggle", item: offerSelection(detail) })
            }
            onClose={() => setDetail(null)}
          />
        )}
      </div>
    </JourneyContext.Provider>
  );
}

function ProjectReview({
  project,
  brief,
  remove,
  onClose,
  onContact,
}: {
  project: Selection[];
  brief: string;
  remove: (key: string) => void;
  onClose: () => void;
  onContact: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${c.previewDialog} ${c.selectionDialog}`}
      aria-labelledby="ac-project-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <span>Votre sélection · {project.length}/8 éléments à étudier</span>
        <button aria-label="Fermer la sélection" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <h2 id="ac-project-title">Votre projet, dans son ensemble.</h2>
      <p>
        Les offres, formules et besoins réunis ici préparent votre demande.
        Cette sélection ne constitue pas une commande.
      </p>
      <ul className={c.selectionList}>
        {project.map((item) => (
          <li key={item.key}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
            <button
              aria-label={`Retirer ${item.title}`}
              onClick={() => remove(item.key)}
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
      {!project.length && (
        <p>
          Vous pouvez nous présenter votre besoin sans sélectionner d’offre, ou
          ajouter des éléments depuis le catalogue et les formules.
        </p>
      )}
      <details className={c.selectionBrief}>
        <summary>Voir le récapitulatif joint</summary>
        <pre>{brief}</pre>
      </details>
      <div className={c.selectionActions}>
        <button
          className={c.secondary}
          disabled={!project.length}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(brief);
              setStatus("Votre récapitulatif a été copié.");
            } catch {
              setStatus(
                "La copie n’est pas disponible ici. Le récapitulatif reste sélectionnable ci-dessus.",
              );
            }
          }}
        >
          <Copy size={16} />
          Copier
        </button>
        <button className={c.primary} onClick={onContact}>
          Préparer ma demande
          <ArrowRight size={16} />
        </button>
      </div>
      <span className={c.readback} role="status">
        {status}
      </span>
    </dialog>
  );
}

function OfferDetail({
  item,
  territory,
  selected,
  onSelect,
  onClose,
}: {
  item: DiscoveryItem;
  territory?: string | null;
  selected: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const action = blocked(item) ? null : nativeAction(item, "fr", territory);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className={c.previewDialog}
      aria-labelledby="ac-offer-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <span>Offre publiée · {item.public_reference}</span>
        <button aria-label="Fermer l’aperçu de l’offre" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <div className={c.detailMedia}>
        <OfferImage item={item} />
      </div>
      <h2 id="ac-offer-title">{item.name}</h2>
      <p>
        {item.description ||
          item.short_description ||
          "Consultez les caractéristiques et conditions de cette offre."}
      </p>
      <ul className={c.detailFacts}>
        <li>
          <strong>{price(item)}</strong>
        </li>
        <li>{availabilityLabel(item, "fr")}</li>
        {projection(item)?.fields.map((fact) => (
          <li key={fact.key}>
            <strong>{fact.label}</strong> : {fact.value}
          </li>
        ))}
      </ul>
      <div className={c.selectionActions}>
        <button
          className={c.primary}
          aria-pressed={selected}
          disabled={blocked(item) && !selected}
          onClick={onSelect}
        >
          {selected ? "Retirer de mon projet" : "Ajouter à mon projet"}
        </button>
        <Link
          className={c.secondary}
          href={businessItemHref(item, "fr", territory)}
        >
          Ouvrir l’offre publiée
          <ArrowRight size={16} />
        </Link>
      </div>
      {action && (
        <p style={{ marginTop: 15 }}>
          <Link className={c.primary} href={action.href}>
            {action.label}
            <ArrowRight size={16} />
          </Link>
        </p>
      )}
    </dialog>
  );
}
