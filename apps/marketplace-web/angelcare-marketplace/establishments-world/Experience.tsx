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
  GraduationCap,
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
import { ConseilExperienceR6 } from "./ConseilExperienceR6";
import { belongsToEstablishmentView } from "../storefront-placement/model";
import { VIEWS, type View } from "./content";
import { EquipmentHeroR11 } from "./EquipmentHeroR11";
import {EquipmentMobileR111} from "./EquipmentMobileR111";
import { EquipmentExperienceR10 } from "./EquipmentExperienceR10";
import {
  blocked,
  offerSelection,
  price,
  requestBrief,
  viewFromHash,
  type Selection,
} from "./model";
import { useProject, useSessionValue } from "./useJourneyState";
import {
  PartnerJourney,
  PartnerBriefFields,
} from "./partner/PartnerOS";
import { PartnerR2Hero } from "./partner/PartnerR2Experience";
import {
  EMPTY_PARTNER,
  HORIZONS,
  restorePartner,
  partnerBrief,
  type PartnerRequest,
} from "./partner/content";
import {
  PartnerLocaleProvider,
  usePartner,
  partnerText,
  type PartnerLocale,
} from "./partner/Locale";
import partner from "./partner/partner.module.css";
import c from "./commercial.module.css";
import tabs from "./EstablishmentsSpecialitiesR7.module.css";
import s from "./journey.module.css";

const ICONS = { conseil: GraduationCap, "partner-os": Monitor, produits: Package };
function localizedProjectNotice(value:string,locale:PartnerLocale){
 if(locale==="fr"||!value)return value;
 const english=locale==="en";
 if(value==="Élément retiré du projet.")return english?"Removed from your project.":"تمت الإزالة من مشروعكم.";
 if(value.endsWith(" ajouté à votre projet.")){
  const name=value.slice(0,-" ajouté à votre projet.".length);
  return english?`${name} added to your project.`:`تمت إضافة ${name} إلى مشروعكم.`;
 }
 if(value.startsWith("Les 22 domaines d’équipements"))return english?"All 22 equipment domains are already selected.":"تم اختيار جميع مجالات التجهيزات الـ٢٢.";
 if(value.startsWith("Votre projet contient huit offres"))return english?"Your project already contains eight offers or other requests. Remove one to add another.":"يحتوي مشروعكم على ثمانية عروض أو طلبات. احذفوا عنصراً لإضافة آخر.";
 return partnerText(locale,value);
}


/** One Partner OS renderer in FR/EN/AR; the parent route owns the shared shell. */
export function EstablishmentsExperience({
  experience,
  initialView,
  partnerOnly = false,
}: {
  experience: StorefrontExperience;
  initialView?: View;
  partnerOnly?: boolean;
}) {
  const locale: PartnerLocale =
    experience.locale === "ar"
      ? "ar"
      : experience.locale === "en"
        ? "en"
        : "fr";
  return (
    <PartnerLocaleProvider locale={locale}>
      <EstablishmentsBody
        experience={experience}
        initialView={initialView}
        partnerOnly={partnerOnly}
      />
    </PartnerLocaleProvider>
  );
}
function EstablishmentsBody({
  experience,
  initialView,
  partnerOnly,
}: {
  experience: StorefrontExperience;
  initialView?: View;
  partnerOnly: boolean;
}) {
  const { locale, t } = usePartner();
  const tr = t;
  const [view, setView] = useState<View>(initialView || "conseil");
  const [values, setValues] = useState<EnquiryValues>({ ...EMPTY_ENQUIRY });
  const [partnerRequest, setPartnerRequest] = useSessionValue<PartnerRequest>(
    `ac.partner.brief.v1:${experience.territoryCode || "default"}`,
    { ...EMPTY_PARTNER, modules: [] },
    restorePartner,
  );
  const updatePartner = useCallback<
    React.Dispatch<React.SetStateAction<PartnerRequest>>
  >(
    (update) => {
      if (document.querySelector('#world-enquiry form[aria-busy="true"]'))
        return;
      setPartnerRequest(update);
    },
    [setPartnerRequest],
  );
  useEffect(() => {
    if (view === "partner-os")
      setValues((before) => ({
        ...before,
        urgency:
          partnerRequest.horizon === HORIZONS[1]
            ? "quarter"
            : partnerRequest.horizon === HORIZONS[2]
              ? "urgent"
              : "exploration",
      }));
  }, [view, partnerRequest.horizon]);
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
    locale,
  );
  const selections = useSelections(experience, experience.items);
  const copy = COMMERCIAL[view];
  const [equipmentR9Brief,setEquipmentR9Brief] = useState("");
  const [conseilR6Brief,setConseilR6Brief] = useState("");
  const [legacyConseil,setLegacyConseil] = useState(false);
  useEffect(()=>{setLegacyConseil(new URLSearchParams(location.search).get("conseilLegacy")==="1")},[]);
  const conseilHasNativeOffers=experience.items.some(item=>belongsToEstablishmentView(item,"conseil"));
  const brief = [
    subject ? `${t("Sujet de la demande")} : ${subject}` : "",
    view === "partner-os" ? partnerBrief(partnerRequest, t) : "",
    view === "produits" ? equipmentR9Brief : "",
    view === "conseil" ? conseilR6Brief : "",
    requestBrief(view, project, experience.territoryCode, t),
  ]
    .filter(Boolean)
    .join("\n");
  const sourceRoute = `/angelcare-marketplace/${locale}/establishments${partnerOnly ? "/partner-os" : ""}${experience.territoryCode ? `?territory=${encodeURIComponent(experience.territoryCode)}` : ""}#${view}`;
  const scrollTo = useCallback(
    (id: string) =>
      document.getElementById(id)?.scrollIntoView({
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
      setView(
        partnerOnly
          ? "partner-os"
          : location.hash
            ? viewFromHash(location.hash)
            : initialView || "conseil",
      );
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
  }, [initialView, partnerOnly]);
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
    if (partnerOnly && next !== "partner-os") return;
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
    // pushState is silent; notify the EN/AR route switcher so Conseil retains
    // its protected legacy authority and Partner OS retains its dedicated renderer.
    if(locale!=="fr")window.dispatchEvent(new Event("hashchange"));
    requestAnimationFrame(() => {
      root.current?.scrollIntoView({ block: "start", behavior: "instant" });
      root.current?.querySelector("h1")?.focus({ preventScroll: true });
    });
  }
  return (
    <JourneyContext.Provider value={view}>
      <div
        ref={root}
        className={`${c.world} ${partner.host}`}
        dir={locale === "ar" ? "rtl" : "ltr"}
        lang={locale}
        data-establishments-journey={view==="produits"?"R11":view==="conseil"&&!legacyConseil?"R6":"R5"}
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
        {view==="produits"&&<EquipmentMobileR111
          locale={locale} count={project.length}
          onExplore={()=>scrollTo("r10-explore")}
          onProducts={()=>scrollTo("ew-native-explorer")}
          onWorlds={()=>scrollTo("r10-universes")}
          onIdeas={()=>scrollTo("r10-collection")}
          onProject={()=>setReview(true)}
        />}
        <nav
          className={c.localNav}
          data-establishments-nav
          aria-label={tr("Les trois spécialités Établissements")}
        >
          <div className={tabs.rail} data-establishments-specialities="R7" dir={locale === "ar" ? "rtl" : "ltr"}>
            {VIEWS.map((item) => {
              const Icon = ICONS[item.key];
              return (
                <a
                  className={tabs.tab}
                  key={item.key}
                  href={
                    partnerOnly && item.key !== "partner-os"
                      ? `/angelcare-marketplace/${locale}/establishments#${item.key}`
                      : `#${item.key}`
                  }
                  aria-current={view === item.key ? "page" : undefined}
                  onClick={(event) => navigate(event, item.key)}
                >
                  <Icon className={tabs.icon} aria-hidden="true" />
                  <span className={tabs.label}>{tr(item.label)}</span>
                </a>
              );
            })}
          </div>
          <div className={c.navUtilities}>
            <button
              onClick={() => scrollTo("ew-native-explorer")}
              title={tr("Revenir aux offres")}
            >
              <Package size={16} />
              {tr("Les offres")}
            </button>
            <button onClick={() => setReview(true)}>
              <Layers3 size={16} />
              {tr("Ma sélection (")}
              {project.length}
              {tr(")")}
            </button>
            <button
              className={c.contactUtility}
              onClick={() => contact({ subject: copy.contact })}
            >
              <MessageCircle size={16} />
              {tr("Parlons-en")}
            </button>
            <button
              aria-label={tr(
                motion ? "Réduire les animations" : "Activer les animations",
              )}
              aria-pressed={motion}
              disabled={systemReduced}
              onClick={() => setMotionChoice((previous) => !previous)}
              title={tr(
                systemReduced
                  ? "Mouvement réduit selon votre préférence système"
                  : "Animations",
              )}
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
        {view === "partner-os" ? (
          <PartnerR2Hero
            onContact={() => scrollTo("pos-project")}
            onExplore={() => scrollTo("pos-atlas")}
          />
        ) : view === "produits" ? (
          <EquipmentHeroR11
            locale={locale}
            onExploreDomains={() => scrollTo("r10-explore")}
            onExploreOffers={() => scrollTo("ew-native-explorer")}
            onExploreDomain={(domainId) => {
              window.dispatchEvent(new CustomEvent("angelcare:equipment-open-domain", {detail:{id:domainId}}));
              scrollTo("r10-universes");
            }}
          />
        ) : view==="conseil" && !legacyConseil ? (
          <ConseilExperienceR6
            locale={locale}
            selected={project.map(item=>item.key)}
            onSelect={(item)=>dispatch({type:"toggle",item})}
            onContact={contact}
            onReview={()=>setReview(true)}
            onBriefChange={setConseilR6Brief}
            storageScope={experience.territoryCode||"default"}
            showNative={conseilHasNativeOffers}
            onExploreNative={()=>scrollTo("ew-native-explorer")}
          />
        ) : (
          <section className={c.hero} data-establishments-hero>
            <div className={c.heroImage}>
              <CampaignImage
                name={VIEWS.find((item) => item.key === view)!.image}
                alt={tr(
                  `Campagne illustrative · ${VIEWS.find((item) => item.key === view)!.label}`,
                )}
                hero
              />
              <span className={c.heroCaption}>
                <CheckCircle2 size={16} />
                {tr("Votre contexte. Vos usages. Votre projet.")}
              </span>
            </div>
            <div className={c.heroCopy}>
              <span className={c.eyebrow}>{tr(copy.eyebrow)}</span>
              <h1 tabIndex={-1}>{tr(copy.title)}</h1>
              <p>{tr(copy.lead)}</p>
              <div className={c.heroActions}>
                <button
                  className={c.primary}
                  onClick={() => contact({ subject: copy.contact })}
                >
                  {tr(copy.contact)}
                  <ArrowRight size={17} />
                </button>
                <button
                  className={c.secondary}
                  onClick={() => scrollTo("ew-native-explorer")}
                >
                  {tr("Voir les offres")}
                  <ArrowDown size={16} />
                </button>
              </div>
              <div className={c.heroFoot}>
                <span>
                  <CheckCircle2 size={14} />
                  {tr("Des solutions selon votre besoin")}
                </span>
                <span>
                  <MessageCircle size={14} />
                  {tr("Un échange avant de vous engager")}
                </span>
              </div>
            </div>
          </section>
        )}
        {(view!=="conseil" || conseilHasNativeOffers || legacyConseil) && <NativeExplorer
          key={`${experience.territoryCode || "default"}:${view}`}
          experience={experience}
          view={view}
          selected={project.map((item) => item.key)}
          add={(item) => dispatch({ type: "toggle", item })}
          selections={selections}
          onDetail={setDetail}
        />}
        {view === "partner-os" ? (
          <PartnerJourney
            request={partnerRequest}
            onRequest={updatePartner}
            onContact={contact}
            onExplore={() => scrollTo("ew-native-explorer")}
            onReview={() => setReview(true)}
            storageScope={experience.territoryCode || "default"}
            motion={motion}
          />
        ) : view === "produits" ? (
          <EquipmentExperienceR10
            key={view}
            locale={locale}
            selected={project.map(item=>item.key)}
            onSelect={(item)=>dispatch({type:"toggle",item})}
            onReview={()=>setReview(true)}
            onContact={contact}
            onExplore={()=>scrollTo("ew-native-explorer")}
            onBriefChange={setEquipmentR9Brief}
            storageScope={experience.territoryCode||"default"}
          />
        ) : view==="conseil" && !legacyConseil ? null : (
          <CommercialJourney
            key={view}
            view={view}
            email={values.email}
            onEmail={(email) =>
              setValues((previous) => ({ ...previous, email }))
            }
            onContact={contact}
            selected={project.map((item) => item.key)}
            onSelect={(item) => dispatch({ type: "toggle", item })}
          />
        )}
        <div className={c.enquiry} data-commercial-block="enquiry">
          {subject && (
            <div className={c.selectedSubject}>
              <MessageCircle size={20} />
              <div>
                <small>{tr("Sujet préparé pour votre demande")}</small>
                <strong>{tr(subject)}</strong>
              </div>
              <button onClick={() => setSubject("")}>
                <X size={14} />
                {tr("Effacer le sujet")}
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
            hasContext={
              view === "partner-os" || !!subject || project.length > 0
            }
            locale={locale}
            partner={view === "partner-os"}
            preparation={
              view === "partner-os" ? (
                <PartnerBriefFields
                  request={partnerRequest}
                  onRequest={updatePartner}
                />
              ) : undefined
            }
          />
        </div>
        <p
          className={s.noticeToast}
          role="status"
          aria-live="polite"
          key={notice}
        >
          {view==="produits"?localizedProjectNotice(notice,locale):tr(notice)}
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
                  (view==="produits"?locale==="en"?"School equipment project":locale==="ar"?"مشروع تجهيز المؤسسة":"Projet · Équipements":`Projet · ${VIEWS.find((item) => item.key === view)!.label}`),
              })
            }
          />
        )}
        {detail && (
          <OfferDetail
            equipmentR11={view==="produits"}
            item={detail}
            territory={experience.territoryCode}
            selected={project.some((item) => item.key === `offer:${detail.id}`)}
            onSelect={() =>
              dispatch({
                type: "toggle",
                item: offerSelection(detail, locale),
              })
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
  const { t: tr } = usePartner();

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
        <span>
          {tr("Votre sélection · ")}
          {project.length}
          {tr("/8 éléments à étudier")}
        </span>
        <button aria-label={tr("Fermer la sélection")} onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <h2 id="ac-project-title">{tr("Votre projet, dans son ensemble.")}</h2>
      <p>
        {tr(
          "Les offres, formules et besoins réunis ici préparent votre demande. Cette sélection ne constitue pas une commande.",
        )}
      </p>
      <ul className={c.selectionList}>
        {project.map((item) => (
          <li key={item.key}>
            <div>
              <strong>
                <bdi>{item.title}</bdi>
              </strong>
              <p>{tr(item.detail)}</p>
            </div>
            <button
              aria-label={tr("Retirer {0}").replace("{0}", item.title)}
              onClick={() => remove(item.key)}
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
      {!project.length && (
        <p>
          {tr(
            "Vous pouvez nous présenter votre besoin sans sélectionner d’offre, ou ajouter des éléments depuis le catalogue et les formules.",
          )}
        </p>
      )}
      <details className={c.selectionBrief}>
        <summary>{tr("Voir le récapitulatif joint")}</summary>
        <pre>{tr(brief)}</pre>
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
          {tr("Copier")}
        </button>
        <button className={c.primary} onClick={onContact}>
          {tr("Préparer ma demande")}
          <ArrowRight size={16} />
        </button>
      </div>
      <span className={c.readback} role="status">
        {tr(status)}
      </span>
    </dialog>
  );
}

function OfferDetail({
  equipmentR11,
  item,
  territory,
  selected,
  onSelect,
  onClose,
}: {
  equipmentR11?: boolean;
  item: DiscoveryItem;
  territory?: string | null;
  selected: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  const { t: tr, locale } = usePartner();

  const ref = useRef<HTMLDialogElement>(null);
  const [zoomed,setZoomed] = useState(false);
  const action = blocked(item) ? null : nativeAction(item, locale, territory);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${c.previewDialog} ${equipmentR11?c.equipmentInspectorR11:""}`}
      data-equipment-inspector={equipmentR11?"r11":undefined}
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
        <span>
          {tr("Offre publiée · ")}
          <bdi>{item.public_reference}</bdi>
        </span>
        <button aria-label={tr("Fermer l’aperçu de l’offre")} onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <div className={c.detailMedia} data-zoomed={zoomed}>
        <OfferImage item={item} />
        {equipmentR11 && item.media_url && <button type="button" className={c.inspectorZoomR11} onClick={()=>setZoomed(v=>!v)} aria-pressed={zoomed}>{tr(zoomed?"Réduire le visuel":"Agrandir le visuel")}</button>}
      </div>
      <h2 id="ac-offer-title">
        <bdi>{item.name}</bdi>
      </h2>
      <p>
        {item.description ||
          item.short_description ||
          tr("Consultez les caractéristiques et conditions de cette offre.")}
      </p>
      <ul className={c.detailFacts}>
        <li>
          <strong>{tr(price(item, locale))}</strong>
        </li>
        <li>{tr(availabilityLabel(item, locale))}</li>
        {projection(item)?.fields.map((fact) => (
          <li key={fact.key}>
            <strong>{fact.label}</strong>
            {tr(" : ")}
            {fact.value}
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
          {tr(selected ? "Retirer de mon projet" : "Ajouter à mon projet")}
        </button>
        <Link
          className={c.secondary}
          href={businessItemHref(item, locale, territory)}
        >
          {tr("Ouvrir l’offre publiée")}
          <ArrowRight size={16} />
        </Link>
      </div>
      {action && (
        <p style={{ marginTop: 15 }}>
          <Link className={c.primary} href={action.href}>
            {tr(action.label)}
            <ArrowRight size={16} />
          </Link>
        </p>
      )}
    </dialog>
  );
}
