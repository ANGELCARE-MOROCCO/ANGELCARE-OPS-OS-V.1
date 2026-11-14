"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Mail,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { ManagedImage } from "../marketplace-imagery/ManagedImage";
import {
  FAMILIES,
  FORMULAS,
  METHOD,
  MODULES,
  PRODUCT_CHAPTERS,
  asset,
  type View,
} from "./content";
import { campaignSet } from "./media";
import { formulaSelection, type Selection } from "./model";
import {
  CAMPAIGNS,
  COMMERCIAL,
  QUESTIONS,
  SCENARIOS,
  type Campaign,
} from "./commercial-content";
import { ModuleIcon } from "./JourneyEditorial";
import c from "./commercial.module.css";

export interface ContactIntent {
  subject: string;
  email?: string;
}
export interface CommercialProps {
  view: View;
  email: string;
  onEmail: (email: string) => void;
  onContact: (intent: ContactIntent) => void;
  selected: string[];
  onSelect: (selection: Selection) => void;
}

/** Only original R4 campaign sources. CSS placement widths stay below their useful crop budget. */
export function CampaignImage({
  name,
  alt,
  hero = false,
  className = "",
}: {
  name: string;
  alt: string;
  hero?: boolean;
  className?: string;
}) {
  return (
    <ManagedImage
      slot={`journey-r4.${name}`}
      src={asset(name)}
      srcSet={campaignSet(name)}
      sizes={
        hero
          ? "(min-width: 1600px) 690px, 48vw"
          : "(min-width: 1600px) 570px, 42vw"
      }
      width={1536}
      height={1024}
      loading={hero ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={hero ? "high" : "auto"}
      alt={alt}
      className={className}
    />
  );
}

function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className={c.sectionHeading}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </header>
  );
}

function ContactPrompt({
  subject,
  title,
  email,
  onEmail,
  onContact,
}: { subject: string; title: string } & Pick<
  CommercialProps,
  "email" | "onEmail" | "onContact"
>) {
  return (
    <aside className={c.contactPrompt} aria-label={`Contact : ${subject}`}>
      <span className={c.contactIcon}>
        <MessageCircle size={21} />
      </span>
      <h3>{title}</h3>
      <p>
        Votre contexte compte. Préparons une réponse adaptée à votre
        établissement.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onContact({ subject, email });
        }}
      >
        <label>
          <span>Votre email professionnel</span>
          <span className={c.emailField}>
            <Mail size={15} />
            <input
              type="email"
              autoComplete="email"
              maxLength={180}
              value={email}
              onChange={(event) => onEmail(event.target.value)}
              placeholder="vous@etablissement.com"
              aria-label={`Email pour ${subject}`}
            />
          </span>
        </label>
        <button type="submit">
          Parlons-en <ArrowRight size={16} />
        </button>
      </form>
      <small>Vous pourrez préciser votre demande avant l’envoi.</small>
    </aside>
  );
}

function CampaignSection({
  campaign,
  index,
  ...props
}: { campaign: Campaign; index: number } & CommercialProps) {
  const modules = MODULES.filter((module) =>
    campaign.modules?.includes(module.id),
  );
  const chapter =
    campaign.chapter === undefined ? null : PRODUCT_CHAPTERS[campaign.chapter];
  return (
    <section
      id={`ac-campaign-${campaign.id}`}
      className={c.campaign}
      data-tone={campaign.tone}
      data-commercial-block="campaign"
      data-reveal
    >
      <div className={c.campaignVisual}>
        <CampaignImage
          name={campaign.image}
          alt={`Scène illustrative · ${campaign.label}`}
        />
        <div className={c.photoCaption}>
          <span>0{index + 1}</span>
          <strong>{campaign.label}</strong>
          <small>Illustration d’ambiance</small>
        </div>
        <blockquote>
          {campaign.question}
          <span>Votre projet mérite une réponse adaptée.</span>
        </blockquote>
      </div>
      <div className={c.campaignContent}>
        <span className={c.eyebrow}>{campaign.label}</span>
        <h2>{campaign.title}</h2>
        <p className={c.pain}>{campaign.lead}</p>
        <p>{campaign.solution}</p>
        <div className={c.benefits}>
          {campaign.benefits.map(([title, text]) => (
            <div key={title}>
              <CheckCircle2 size={18} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
        {modules.length > 0 && (
          <div className={c.capabilityNames} aria-label="Capacités concernées">
            {modules.map((module) => (
              <span key={module.id}>
                <ModuleIcon group={module.group} id={module.id} />
                {module.title}
              </span>
            ))}
          </div>
        )}
        {chapter && (
          <div className={c.universeNames}>
            {chapter.universes.map((universe, i) => (
              <div
                key={universe.title}
                data-universe={campaign.chapter! * 4 + i + 1}
              >
                <span>
                  {String(campaign.chapter! * 4 + i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{universe.title}</h3>
                  <p>{universe.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <details className={c.inPlaceDetail}>
          <summary>
            {campaign.detailTitle}
            <ChevronDown size={18} />
          </summary>
          <div>
            <p>{campaign.detail}</p>
            {modules.length > 0 && (
              <dl className={c.moduleDetails}>
                {modules.map((module) => (
                  <div key={module.id} data-module={module.id}>
                    <dt>{module.title}</dt>
                    <dd>{module.text}</dd>
                  </div>
                ))}
              </dl>
            )}
            {campaign.family && (
              <div className={c.cadences}>
                {FORMULAS.filter(
                  (formula) => formula.family === campaign.family,
                ).map((formula) => (
                  <div key={formula.id}>
                    <strong>{formula.name}</strong>
                    <span>{formula.frequency}</span>
                    <small>{formula.reporting}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      </div>
      <ContactPrompt
        subject={campaign.label}
        title={campaign.question}
        {...props}
      />
    </section>
  );
}

const DELIVERABLES = [
  {
    title: "Calendrier d’ateliers",
    icon: ClipboardCheck,
    intro: "Préparer le rythme, le thème et les objectifs.",
    rows: [
      ["Thème retenu", "À préciser selon les groupes"],
      ["Cadence", "Selon la formule étudiée"],
      ["Organisation", "Espaces, personnes et temps concernés"],
      ["Suite", "Repères pour les prochaines interventions"],
    ],
  },
  {
    title: "Supports de formation",
    icon: GraduationCap,
    intro: "Relier la compétence travaillée aux pratiques.",
    rows: [
      ["Compétence", "Priorité identifiée avec la direction"],
      ["Mise en situation", "Exemple relié au contexte de l’équipe"],
      ["Repères", "Points à partager et à reprendre"],
      ["Suivi", "Recommandations selon le parcours"],
    ],
  },
  {
    title: "Communication parents",
    icon: MessageCircle,
    intro: "Expliquer une action et lui donner du sens.",
    rows: [
      ["L’action", "Ce qui a été proposé aux enfants"],
      ["L’intention", "Le thème et les objectifs retenus"],
      ["Le partage", "Un message adapté aux familles"],
      ["La continuité", "Prochaine étape ou temps d’échange"],
    ],
  },
  {
    title: "Reporting de suivi",
    icon: FileText,
    intro: "Partager une lecture utile des actions réalisées.",
    rows: [
      ["Contexte", "Priorité et périmètre retenus"],
      ["Actions", "Éléments à renseigner selon la formule"],
      ["Lecture", "Synthèse destinée à la direction"],
      ["Suite", "Points à préciser et prochaines étapes"],
    ],
  },
];

function DeliverablePreview({
  item,
  onClose,
}: {
  item: (typeof DELIVERABLES)[number];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className={c.previewDialog}
      aria-labelledby="ac-deliverable-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <span>Aperçu de structure · selon la formule</span>
        <button onClick={onClose} aria-label="Fermer l’aperçu">
          <X size={20} />
        </button>
      </header>
      <item.icon size={35} />
      <h2 id="ac-deliverable-title">{item.title}</h2>
      <p>{item.intro}</p>
      <dl>
        {item.rows.map(([title, value]) => (
          <div key={title}>
            <dt>{title}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className={c.previewNote}>
        Cette structure est illustrative. Les documents, leur format et leur
        fréquence sont définis dans la proposition retenue.
      </p>
      <button className={c.primary} onClick={onClose}>
        Revenir à ma lecture <ArrowRight size={16} />
      </button>
    </dialog>
  );
}

function ProgrammeGuide(props: CommercialProps) {
  const [family, setFamily] = useState<"edup" | "academy" | "parents">("edup");
  const [preview, setPreview] = useState<(typeof DELIVERABLES)[number] | null>(
    null,
  );
  return (
    <section
      className={c.guide}
      data-commercial-block="guide"
      id="ac-reference-formulas"
    >
      <SectionHeading
        eyebrow="Des repères pour décider"
        title="Le bon niveau d’accompagnement commence par votre priorité."
      >
        Les neuf formules sont des références de brochure. Comparez les cadences
        et les livrables ; les offres du catalogue et la proposition conservent
        leurs propres prix, disponibilités et conditions.
      </SectionHeading>
      <div className={c.formulaFamilies}>
        {FAMILIES.map((group) => (
          <article
            key={group.key}
            data-tone={
              group.key === "edup"
                ? "green"
                : group.key === "academy"
                  ? "pink"
                  : "teal"
            }
          >
            <header>
              <span>{group.name}</span>
              <p>{group.purpose}</p>
            </header>
            {FORMULAS.filter((formula) => formula.family === group.key).map(
              (formula) => {
                const selected = props.selected.includes(
                  `formula:${formula.id}`,
                );
                return (
                  <details
                    key={formula.id}
                    className={c.formula}
                    data-formula={formula.id}
                  >
                    <summary>
                      <span>
                        <strong>{formula.name}</strong>
                        <small>{formula.frequency}</small>
                      </span>
                      <b>
                        {new Intl.NumberFormat("fr-FR").format(formula.amount)}{" "}
                        <small>MAD / {formula.unit}</small>
                      </b>
                      <ChevronDown size={16} />
                    </summary>
                    <div>
                      <p>
                        {formula.volume} · {formula.reporting}
                      </p>
                      <ul>
                        {[...new Set([formula.support, ...formula.facts])].map(
                          (fact) => (
                            <li key={fact}>
                              <Check size={14} />
                              {fact}
                            </li>
                          ),
                        )}
                      </ul>
                      <button
                        aria-pressed={selected}
                        onClick={() =>
                          props.onSelect(formulaSelection(formula))
                        }
                      >
                        {selected ? <Check size={15} /> : <Plus size={15} />}
                        {selected ? "Dans mon projet" : "Étudier cette formule"}
                      </button>
                      <button
                        onClick={() =>
                          props.onContact({
                            subject: `Conseil & programmes · ${formula.name}`,
                          })
                        }
                      >
                        Parlons de cette formule <ArrowRight size={14} />
                      </button>
                    </div>
                  </details>
                );
              },
            )}
          </article>
        ))}
      </div>
      <details className={c.inPlaceDetail}>
        <summary>
          Comparer les formules d’une même famille
          <ChevronDown size={18} />
        </summary>
        <div>
          <label className={c.compareLabel}>
            Famille à comparer{" "}
            <select
              aria-label="Famille à comparer"
              value={family}
              onChange={(event) =>
                setFamily(event.target.value as typeof family)
              }
            >
              {FAMILIES.map((group) => (
                <option key={group.key} value={group.key}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <div className={c.comparisonScroll}>
            <table>
              <caption>
                Références de brochure · unités et périmètres propres à chaque
                formule
              </caption>
              <thead>
                <tr>
                  <th scope="col">Votre repère</th>
                  {FORMULAS.filter((formula) => formula.family === family).map(
                    (formula) => (
                      <th scope="col" key={formula.id}>
                        {formula.name}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {(["frequency", "volume", "reporting", "support"] as const).map(
                  (field, i) => (
                    <tr key={field}>
                      <th scope="row">
                        {["Cadence", "Périmètre", "Suivi", "Accompagnement"][i]}
                      </th>
                      {FORMULAS.filter(
                        (formula) => formula.family === family,
                      ).map((formula) => (
                        <td key={formula.id}>{formula[field]}</td>
                      ))}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>
      <div className={c.deliverableHeading}>
        <h3>Ce qui devient concret.</h3>
        <p>
          Ouvrez un aperçu de structure pour comprendre le rôle de chaque
          livrable.
        </p>
      </div>
      <div className={c.deliverables}>
        {DELIVERABLES.map((item) => (
          <button key={item.title} onClick={() => setPreview(item)}>
            <span className={c.paperPreview}>
              <item.icon size={30} />
              {item.rows.slice(0, 3).map(([title]) => (
                <i key={title}>
                  <Check size={10} />
                  {title}
                </i>
              ))}
            </span>
            <strong>{item.title}</strong>
            <span>{item.intro}</span>
            <small>
              Ouvrir l’aperçu <ArrowRight size={13} />
            </small>
          </button>
        ))}
      </div>
      {preview && (
        <DeliverablePreview item={preview} onClose={() => setPreview(null)} />
      )}
    </section>
  );
}

function ContextGuide(props: CommercialProps) {
  const [step, setStep] = useState(0);
  const partner = props.view === "partner-os";
  const steps = partner
    ? [
        [
          "Votre contexte",
          "Décrivez une situation qui disperse vos informations ou votre suivi. Les personnes, les étapes et les documents concernés nous aident à comprendre le besoin.",
        ],
        [
          "Votre périmètre",
          "Distinguez le plan, les capacités, les options et l’accompagnement. Les vingt domaines présentés ne sont pas automatiquement inclus dans le plan gratuit.",
        ],
        [
          "Votre mise en route",
          "Précisez les conditions, les responsabilités et les prochaines étapes avant l’activation. La demande ne souscrit pas un abonnement à votre place.",
        ],
      ]
    : [
        [
          "Vos usages",
          "Situez les espaces, les personnes et les activités concernés. Ce que vous possédez déjà et ce que vous souhaitez conserver font partie du projet.",
        ],
        [
          "Vos choix",
          "Reliez les références retenues à leurs caractéristiques. Les formats, quantités et possibilités de personnalisation doivent être vérifiés pour chaque offre.",
        ],
        [
          "Votre proposition",
          "Les prix, disponibilités et conditions sont ceux des offres et de la proposition. Une image d’ambiance et une sélection de projet ne constituent pas une commande.",
        ],
      ];
  return (
    <section
      className={c.contextGuide}
      data-commercial-block="guide"
      data-tone={partner ? "navy" : "teal"}
    >
      <div>
        <span className={c.eyebrow}>
          {partner
            ? "12 mois sur le plan gratuit · conditions à confirmer"
            : "Personnalisation, usages, proposition"}
        </span>
        <h2>
          {partner
            ? "Une année pour préparer une autre façon de travailler."
            : "Votre projet ne se résume pas à une liste d’objets."}
        </h2>
        <p>
          {partner
            ? "Le plan gratuit est un point de départ à étudier. Le bon choix relie votre besoin, les capacités disponibles et les conditions de mise en route. Gardez une lecture claire de ce qui est proposé avant l’activation."
            : "Un accueil, une classe et des supports d’équipe ont des usages différents. La cohérence vient des choix que vous reliez à votre contexte, des options réellement disponibles et de la manière dont la proposition est préparée."}
        </p>
        <button
          className={c.primary}
          onClick={() =>
            props.onContact({
              subject: partner
                ? "Partner OS · plan gratuit pendant 12 mois"
                : "Produits · préparer un ensemble cohérent",
            })
          }
        >
          Préparons votre projet <ArrowRight size={16} />
        </button>
      </div>
      <div className={c.stepDemo}>
        <div role="group" aria-label="Étapes de préparation">
          {steps.map(([title], i) => (
            <button
              key={title}
              aria-pressed={step === i}
              onClick={() => setStep(i)}
            >
              <span>0{i + 1}</span>
              {title}
            </button>
          ))}
        </div>
        <div role="status">
          <span>0{step + 1}</span>
          <h3>{steps[step][0]}</h3>
          <p>{steps[step][1]}</p>
        </div>
        <small>
          {partner
            ? "Présentation des usages · disponibilité selon le plan"
            : "Les caractéristiques de chaque offre restent la référence"}
        </small>
      </div>
    </section>
  );
}

export function CommercialJourney(props: CommercialProps) {
  const { view } = props;
  const copy = COMMERCIAL[view];
  const [priority, setPriority] = useState<number | null>(null);
  return (
    <div className={c.editorial}>
      <section className={c.introduction} data-commercial-block="introduction">
        <SectionHeading
          eyebrow="Votre réalité. Des pistes concrètes."
          title={copy.intro}
        >
          {copy.introduction}
        </SectionHeading>
        <div className={c.priorityChoices}>
          <span>
            <Sparkles size={17} />
            Votre priorité aujourd’hui
          </span>
          {copy.priorities.map((label, i) => (
            <button
              key={label}
              aria-pressed={priority === i}
              onClick={() => setPriority(priority === i ? null : i)}
            >
              {label}
              <Plus size={14} />
            </button>
          ))}
        </div>
        {priority !== null && (
          <div className={c.priorityAnswer} role="status">
            <strong>{SCENARIOS[view][priority].title}</strong>
            <p>{SCENARIOS[view][priority].text}</p>
            <button
              onClick={() =>
                props.onContact({ subject: SCENARIOS[view][priority!].subject })
              }
            >
              Parlons de cette priorité <ArrowRight size={15} />
            </button>
          </div>
        )}
      </section>
      {CAMPAIGNS[view].map((campaign, index) => (
        <CampaignSection
          key={`${view}:${campaign.id}`}
          campaign={campaign}
          index={index}
          {...props}
        />
      ))}
      <section className={c.scenarios} data-commercial-block="scenarios">
        <SectionHeading
          eyebrow="Vous pouvez partir d’une situation, pas d’une référence"
          title="Vous reconnaissez votre établissement ?"
        >
          Choisissez le contexte qui se rapproche du vôtre. Votre demande
          reprendra ce sujet et vous pourrez le préciser avant de l’envoyer.
        </SectionHeading>
        <div>
          {SCENARIOS[view].map((scenario, index) => (
            <article key={scenario.subject}>
              <span>0{index + 1}</span>
              <h3>{scenario.title}</h3>
              <p>{scenario.text}</p>
              <button
                onClick={() => props.onContact({ subject: scenario.subject })}
              >
                C’est mon sujet, parlons-en <ArrowRight size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>
      {view === "conseil" ? (
        <ProgrammeGuide {...props} />
      ) : (
        <ContextGuide {...props} />
      )}
      <section className={c.method} data-commercial-block="method">
        <SectionHeading
          eyebrow="Un échange utile commence par des repères clairs"
          title="Un accompagnement à construire avec vous."
        >
          Comprendre votre situation, préciser les choix et préparer la suite :
          chaque étape sert à rendre le projet plus lisible pour votre
          établissement.
        </SectionHeading>
        <ol>
          {METHOD.map(([title, text], index) => (
            <li key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <div className={c.methodClose}>
          <ShieldCheck size={23} />
          <p>
            Le périmètre, les livrables et les conditions sont précisés avant
            tout engagement. Votre demande ne vaut ni achat ni activation
            automatique.
          </p>
          <button
            onClick={() =>
              props.onContact({ subject: `${copy.contact} · premier échange` })
            }
          >
            Préparons le premier échange <ArrowRight size={16} />
          </button>
        </div>
      </section>
      <section className={c.questions} data-commercial-block="questions">
        <SectionHeading
          eyebrow="Les bonnes questions méritent une réponse ici"
          title="Décidez avec des repères clairs."
        >
          Retrouvez les informations utiles avant de nous présenter votre
          contexte. Vous pouvez garder plusieurs réponses ouvertes et poursuivre
          votre lecture.
        </SectionHeading>
        <div>
          {QUESTIONS[view].map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <ChevronDown size={18} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className={c.closing} data-commercial-block="closing">
        <span>
          <MessageCircle size={30} />
        </span>
        <div>
          <h2>{copy.closing}</h2>
          <p>
            Votre priorité, votre contexte, vos attentes : donnez-nous les
            éléments utiles pour préparer un échange. Votre sélection et le
            sujet choisi sont transmis avec votre demande.
          </p>
        </div>
      </section>
    </div>
  );
}
