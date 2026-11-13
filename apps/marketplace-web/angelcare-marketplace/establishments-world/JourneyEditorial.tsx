import { JourneyLink } from "./JourneyLink";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  Network,
  ChartNoAxesCombined,
  KeyRound,
  ClipboardList,
  ContactRound,
  HeartHandshake,
  Package,
  Store,
  FileSignature,
  ReceiptText,
  BriefcaseBusiness,
  CreditCard,
  LifeBuoy,
  Files,
  MessagesSquare,
  MonitorCheck,
  PackageCheck,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { View } from "./content";
import s from "./journey.module.css";

const SIGNALS = {
  conseil: [
    ["03", "Leviers complémentaires"],
    ["09", "Formules à comparer"],
    ["01", "Diagnostic partenariat gratuit"],
  ],
  "partner-os": [
    ["12", "Mois sur le plan gratuit"],
    ["20", "Domaines à explorer"],
    ["01", "Écosystème modulaire"],
  ],
  produits: [
    ["16", "Univers complémentaires"],
    ["04", "Chapitres pour vos usages"],
    ["01", "Projet pour tout relier"],
  ],
};
export function HeroSignals({ view }: { view: View }) {
  return (
    <div className={s.heroSignals}>
      {SIGNALS[view].map(([number, label]) => (
        <div key={label}>
          <strong>{number}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
export const GROUP_ICONS = {
  Piloter: MonitorCheck,
  Accueillir: MessagesSquare,
  Commercialiser: PackageCheck,
  Organiser: UsersRound,
  Suivre: ShieldCheck,
};
const MODULE_ICONS = {
  direction: LayoutDashboard,
  multi: Network,
  reporting: ChartNoAxesCombined,
  roles: KeyRound,
  admissions: ClipboardList,
  crm: ContactRound,
  experience: HeartHandshake,
  communication: MessagesSquare,
  services: Package,
  marketplace: Store,
  devis: FileSignature,
  facturation: ReceiptText,
  rh: UsersRound,
  formation: GraduationCap,
  operations: BriefcaseBusiness,
  calendrier: CalendarDays,
  paiements: CreditCard,
  qualite: ShieldCheck,
  support: LifeBuoy,
  documents: Files,
};
export function ModuleIcon({ group, id }: { group: string; id?: string }) {
  const Icon =
    MODULE_ICONS[id as keyof typeof MODULE_ICONS] ||
    GROUP_ICONS[group as keyof typeof GROUP_ICONS] ||
    Layers3;
  return <Icon size={22} />;
}

export function ProgrammeDeliverables() {
  const documents = [
    {
      title: "Calendrier d’ateliers",
      icon: CalendarDays,
      lines: [
        "Thèmes & objectifs",
        "Cadence des interventions",
        "Organisation des temps forts",
      ],
      family: "edup",
    },
    {
      title: "Supports de formation",
      icon: GraduationCap,
      lines: [
        "Compétence travaillée",
        "Mise en situation",
        "Repères pour l’équipe",
      ],
      family: "academy",
    },
    {
      title: "Fiche de compétences",
      icon: ClipboardCheck,
      lines: [
        "Pratiques observées",
        "Points à travailler",
        "Recommandations terrain",
      ],
      family: "academy",
    },
    {
      title: "Communication parents",
      icon: MessagesSquare,
      lines: [
        "Actions et temps de rencontre",
        "Supports de communication",
        "Continuité école-famille",
      ],
      family: "parents",
    },
    {
      title: "Reporting de suivi",
      icon: FileCheck2,
      lines: [
        "Actions réalisées",
        "Synthèse selon formule",
        "Prochaines étapes",
      ],
      family: "parents",
    },
  ];
  return (
    <section className={s.documentSection} id="ew-deliverables">
      <div>
        <span className={s.eyebrow}>Du programme aux outils de terrain</span>
        <h2>Vous devez voir ce qui se met en place.</h2>
        <p>
          Des formats de livrables à préciser dans votre proposition, selon la
          formule choisie.
        </p>
      </div>
      <div className={s.documentGrid}>
        {documents.map(({ title, icon: Icon, lines, family }, index) => (
          <article key={title} data-family={family}>
            <span className={s.documentNumber}>0{index + 1}</span>
            <Icon size={30} />
            <h3>{title}</h3>
            <ul>
              {lines.map((line) => (
                <li key={line}>
                  <CheckCircle2 size={12} />
                  {line}
                </li>
              ))}
            </ul>
            <small>Structure illustrative · selon formule</small>
          </article>
        ))}
      </div>
    </section>
  );
}

const FAQS: Record<View, { question: string; answer: string }[]> = {
  conseil: [
    {
      question: "Comment choisir entre EduPlay, Academy Pro et ParentTrust ?",
      answer:
        "Partez de votre priorité : enrichir l’expérience enfant, professionnaliser les équipes ou structurer la relation avec les familles. Comparez ensuite les cadences, livrables et modalités d’accompagnement au sein de cette famille.",
    },
    {
      question: "Que couvrent les tarifs présentés ?",
      answer:
        "Les neuf tarifs sont des références de la brochure, avec leur unité propre : mois, session, programme ou parcours. Les conditions de la proposition et celles d’une offre publiée précisent le périmètre applicable.",
    },
    {
      question: "Peut-on combiner plusieurs leviers ?",
      answer:
        "Vous pouvez réunir plusieurs formules dans votre projet pour étudier une combinaison. Le diagnostic permet de préciser les priorités et le périmètre de la proposition ; il ne crée pas automatiquement un forfait commun.",
    },
    {
      question: "Quels livrables seront remis ?",
      answer:
        "Le calendrier, les supports de formation, les outils de communication et le reporting dépendent de la formule retenue. Les détails et le comparatif rendent visibles les livrables annoncés dans la brochure.",
    },
  ],
  "partner-os": [
    {
      question: "Le plan gratuit dure-t-il vraiment une année ?",
      answer:
        "L’offre mise en avant porte sur douze mois complets sur le plan gratuit. La demande permet de préciser son périmètre, ses conditions et son activation.",
    },
    {
      question: "Les vingt domaines sont-ils tous gratuits ?",
      answer:
        "Les vingt domaines décrivent les capacités présentées dans la brochure. Leur disponibilité dépend du plan et de la configuration choisis. Ils ne constituent pas une promesse que toutes les options sont incluses dans le plan gratuit.",
    },
    {
      question: "Comment commencer avec Partner OS ?",
      answer:
        "Explorez les capacités, ajoutez celles qui vous intéressent et préparez votre demande. L’échange sert à choisir le plan, préciser la configuration et préparer la mise en route.",
    },
    {
      question: "Peut-on étudier plusieurs établissements ?",
      answer:
        "Le domaine Multi-établissements est présenté dans la brochure. Précisez vos sites et votre organisation dans la demande afin d’en étudier le périmètre et les conditions dans le plan retenu.",
    },
  ],
  produits: [
    {
      question: "Comment constituer une sélection cohérente ?",
      answer:
        "Utilisez les filtres pour explorer les offres publiées, consultez leurs caractéristiques et réunissez jusqu’à huit éléments dans votre projet. Les seize univers expliquent comment les usages peuvent se compléter.",
    },
    {
      question: "Les produits sont-ils personnalisables ?",
      answer:
        "La personnalisation dépend de chaque offre. Les caractéristiques publiées et la proposition précisent les options. Vous pouvez décrire vos besoins d’identité, de formats et d’usages dans votre demande.",
    },
    {
      question: "Comment obtenir le prix et les conditions ?",
      answer:
        "Une offre affiche son prix publié ou la mention Sur devis. Son parcours natif permet de consulter les conditions et de préparer la conversion correspondante. Une sélection de projet prépare un échange commercial.",
    },
    {
      question: "Les visuels garantissent-ils une disponibilité immédiate ?",
      answer:
        "Les images illustrent les solutions et les supports. La disponibilité affichée par chaque offre publiée, le territoire et les conditions de la proposition restent les références pour votre projet.",
    },
  ],
};
export function JourneyFAQ({ view }: { view: View }) {
  return (
    <section className={s.faq} id="ew-questions" aria-labelledby="ew-faq-title">
      <div>
        <span className={s.eyebrow}>Décider avec des repères clairs</span>
        <h2 id="ew-faq-title">
          Les bonnes questions, avant la prochaine étape.
        </h2>
        <p>
          Précisez votre besoin. Comprenez le périmètre. Préparez votre projet.
        </p>
        <JourneyLink className={s.secondary} href="#world-enquiry">
          Présenter mon projet
          <ArrowRight size={15} />
        </JourneyLink>
      </div>
      <div>
        {FAQS[view].map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export const PROGRAMME_POINTS: Record<string, string[]> = {
  edup: [
    "Des activités organisées autour de thèmes et d’objectifs adaptés au contexte de l’établissement.",
    "Une cadence lisible et des repères pour préparer les interventions.",
    "Des traces et un reporting selon formule pour rendre les actions compréhensibles par les familles.",
  ],
  academy: [
    "Des mises en situation reliées aux pratiques de l’équipe.",
    "Des repères sur la posture, l’hygiène, la vigilance et la communication.",
    "Des recommandations et un accompagnement à préciser selon le parcours.",
  ],
  parents: [
    "Un parcours d’accueil plus lisible pour les familles et l’équipe.",
    "Des supports et des actions qui donnent une continuité aux échanges.",
    "Des outils de suivi et un reporting selon le niveau d’accompagnement choisi.",
  ],
};
