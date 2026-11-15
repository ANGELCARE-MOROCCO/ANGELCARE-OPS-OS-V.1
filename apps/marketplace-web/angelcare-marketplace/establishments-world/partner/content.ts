/** Source: ACB2BCRECHE, supplied 17-page catalogue. Page numbers refer to PDF order.
 * Commercial capabilities never acquire a sellable catalogue identity here. */
export const CHAPTERS = [
  {
    key: "direction",
    label: "Direction",
    title: "Votre vision mérite un vrai poste de pilotage.",
    lead: "Centralisez l’essentiel, gardez une lecture par site et préparez vos prochaines décisions.",
    cta: "Préparer mon pilotage",
    page: [4, 5],
    modules: ["direction", "sites", "reporting"],
  },
  {
    key: "familles",
    label: "Familles",
    title: "Chaque relation commence avant l’inscription.",
    lead: "De la première demande à la vie de l’école, préparez un parcours simple, lisible et rassurant.",
    cta: "Structurer mon parcours familles",
    page: [6, 7, 9],
    modules: ["admissions", "crm", "parents", "communication"],
  },
  {
    key: "quotidien",
    label: "Vie de l’école",
    title: "Une journée préparée. Un quotidien qui avance.",
    lead: "Planifiez les activités, reliez les responsabilités et rendez le suivi plus facile à partager.",
    cta: "Coordonner mon quotidien",
    page: [8, 17],
    modules: ["planning", "operations"],
  },
  {
    key: "equipes",
    label: "Équipes",
    title: "Une équipe alignée fait toute la différence.",
    lead: "Recrutement, transmission, formation et qualité : donnez un cadre lisible aux pratiques de votre équipe.",
    cta: "Préparer l’organisation de mon équipe",
    page: [15, 17],
    modules: ["rh", "formation", "qualite", "roles"],
  },
  {
    key: "revenus",
    label: "Revenus",
    title: "De votre proposition au suivi du règlement.",
    lead: "Reliez votre offre, les conditions convenues, la facturation et le suivi des paiements.",
    cta: "Préparer mon organisation commerciale",
    page: [10, 12, 13, 14],
    modules: ["plans", "services", "facturation", "paiements"],
  },
  {
    key: "ecosysteme",
    label: "Écosystème",
    title: "Votre établissement évolue. Votre environnement aussi.",
    lead: "Un même environnement pour enrichir votre périmètre, centraliser les documents et préparer l’accompagnement adapté.",
    cta: "Composer mon périmètre",
    page: [3, 11, 17],
    modules: ["marketplace", "documents", "support"],
  },
] as const;
export type ChapterKey = (typeof CHAPTERS)[number]["key"];
export type ModuleKey =
  | "direction"
  | "sites"
  | "reporting"
  | "admissions"
  | "crm"
  | "parents"
  | "communication"
  | "planning"
  | "operations"
  | "rh"
  | "formation"
  | "qualite"
  | "roles"
  | "plans"
  | "services"
  | "facturation"
  | "paiements"
  | "marketplace"
  | "documents"
  | "support";
export type PartnerModule = {
  key: ModuleKey;
  label: string;
  tag: string;
  summary: string;
  benefits: readonly string[];
  uses: readonly string[];
  detail: string;
  prepare: string;
  related: readonly ModuleKey[];
  pages: readonly number[];
};
export const MODULES: readonly PartnerModule[] = [
  {
    key: "direction",
    label: "Direction & vue d’ensemble",
    tag: "Pilotage",
    summary:
      "Une lecture commune pour retrouver vos priorités et préparer vos décisions.",
    benefits: [
      "Réunir les informations utiles à la direction",
      "Repérer les priorités et les points d’attention",
      "Partager une lecture claire de l’activité",
    ],
    uses: ["Vue établissement", "Priorités", "Suivi direction"],
    detail:
      "Le cockpit de direction présenté dans le catalogue réunit les dimensions commerciales, opérationnelles et organisationnelles. La démonstration part de vos questions concrètes : ce que vous devez voir, à quel moment et avec quelles responsabilités.",
    prepare:
      "Identifiez les décisions récurrentes, les informations aujourd’hui dispersées et les personnes qui doivent pouvoir les consulter.",
    related: ["sites", "reporting", "roles"],
    pages: [4],
  },
  {
    key: "sites",
    label: "Multi-établissements",
    tag: "Réseau",
    summary:
      "Pilotez plusieurs sites avec une vue consolidée et des repères propres à chacun.",
    benefits: [
      "Garder une lecture par établissement",
      "Comparer les besoins et les ressources",
      "Coordonner les priorités du réseau",
    ],
    uses: ["Sites", "Comparaison", "Coordination"],
    detail:
      "Le catalogue distingue une vue groupe et une lecture par établissement. Nous préparons avec vous la hiérarchie du réseau, les informations communes et les besoins spécifiques à chaque site, sans effacer leur contexte.",
    prepare:
      "Précisez le nombre de sites, leur organisation et les responsabilités locales ou centrales.",
    related: ["direction", "reporting", "roles"],
    pages: [5],
  },
  {
    key: "reporting",
    label: "Reporting, KPI & tableaux de bord",
    tag: "Suivi",
    summary:
      "Organisez les suivis de l’activité pour rendre les échanges de direction plus concrets.",
    benefits: [
      "Organiser les indicateurs utiles à votre activité",
      "Préparer des points de suivi partagés",
      "Relier les observations aux actions à examiner",
    ],
    uses: ["Indicateurs", "Rapports", "Actions"],
    detail:
      "Les tableaux de bord et rapports servent une lecture suivie de votre activité. Le périmètre des indicateurs, leurs sources et leur fréquence sont étudiés selon votre fonctionnement ; une projection visuelle ne constitue pas une mesure de vos résultats.",
    prepare:
      "Apportez les questions auxquelles vos suivis actuels ne répondent pas et les rapports que votre équipe utilise déjà.",
    related: ["direction", "operations", "facturation"],
    pages: [3, 4, 17],
  },
  {
    key: "admissions",
    label: "Admissions & inscriptions",
    tag: "Admissions",
    summary:
      "De la demande d’information à l’inscription, un parcours plus fluide et structuré.",
    benefits: [
      "Centraliser les demandes et les dossiers",
      "Structurer les étapes jusqu’à l’inscription",
      "Suivre l’avancement et les pièces à préparer",
    ],
    uses: ["Demandes", "Dossiers", "Inscriptions"],
    detail:
      "Préinscription, visite, pièces, validation et contrat : le catalogue présente un parcours d’admission relié. La démonstration précise les étapes que vous souhaitez suivre et la façon dont les informations passent entre l’accueil, la direction et les familles.",
    prepare:
      "Décrivez vos étapes d’admission, les pièces demandées et les intervenants qui valident le dossier.",
    related: ["crm", "documents", "plans"],
    pages: [6],
  },
  {
    key: "crm",
    label: "CRM parents & leads",
    tag: "Relation",
    summary:
      "Suivez vos contacts, vos échanges et les opportunités d’inscription.",
    benefits: [
      "Suivre les contacts et leurs demandes",
      "Qualifier les besoins et les opportunités",
      "Garder l’historique des échanges utiles",
    ],
    uses: ["Contacts", "Relances", "Opportunités"],
    detail:
      "Le CRM organise la relation avant et autour de l’inscription : contacts, besoins, relances et historique. Les étapes commerciales et les responsabilités sont définies avec votre équipe pour éviter un suivi dépendant d’un seul interlocuteur.",
    prepare:
      "Indiquez vos canaux d’entrée, vos étapes de suivi et les moments où une relance est utile.",
    related: ["admissions", "communication", "reporting"],
    pages: [9],
  },
  {
    key: "parents",
    label: "Expérience parent",
    tag: "Familles",
    summary:
      "Préparez une relation plus lisible entre les familles et votre établissement.",
    benefits: [
      "Clarifier les informations et les étapes",
      "Faciliter l’accès aux échanges utiles",
      "Préparer une expérience parent cohérente",
    ],
    uses: ["Portail parent", "Informations", "Relation"],
    detail:
      "Le catalogue relie portail parent, communication, engagement et satisfaction. La préparation consiste à définir ce que les familles doivent comprendre, retrouver et recevoir, selon leur situation et les droits prévus.",
    prepare:
      "Choisissez les informations récurrentes, les publics concernés et les moments importants du parcours famille.",
    related: ["communication", "admissions", "documents"],
    pages: [3, 17],
  },
  {
    key: "communication",
    label: "Communication & messagerie",
    tag: "Échanges",
    summary:
      "Informez, échangez et gardez des repères communs avec les familles et les équipes.",
    benefits: [
      "Structurer les moments et les canaux d’information",
      "Suivre les échanges entre familles et équipe",
      "Préparer annonces, messages et documents",
    ],
    uses: ["Messages", "Annonces", "Documents"],
    detail:
      "Messagerie, notifications, annonces et pièces jointes composent la communication présentée dans le catalogue. Les destinataires, validations et modalités d’accès sont précisés dans votre périmètre, avant toute mise en route.",
    prepare:
      "Repérez les messages répétitifs, les groupes de destinataires et les validations nécessaires.",
    related: ["parents", "crm", "documents"],
    pages: [7],
  },
  {
    key: "planning",
    label: "Calendrier & planification",
    tag: "Vie de l’école",
    summary:
      "Reliez activités, programmes, événements et ressources dans un quotidien préparé.",
    benefits: [
      "Organiser le planning des activités",
      "Gérer les échéances et les temps forts",
      "Partager un calendrier clair avec l’équipe",
    ],
    uses: ["Activités & programmes", "Ressources", "Échéances"],
    detail:
      "L’axe activités et programmes du catalogue couvre la planification, les contenus et le suivi. Nous préparons les niveaux, groupes, ressources et rythmes de votre établissement afin que la démonstration explique un vrai usage quotidien.",
    prepare:
      "Précisez les groupes, les programmes, les contraintes horaires et les ressources à coordonner.",
    related: ["operations", "communication", "formation"],
    pages: [8, 17],
  },
  {
    key: "operations",
    label: "Opérations & missions",
    tag: "Coordination",
    summary:
      "Répartissez les responsabilités et donnez une continuité au suivi des actions.",
    benefits: [
      "Répartir les tâches et les responsabilités",
      "Garder les échéances et les actions visibles",
      "Conserver une trace des opérations du quotidien",
    ],
    uses: ["Missions", "Tâches", "Suivi"],
    detail:
      "Tâches, missions, maintenance et fournisseurs apparaissent dans la carte fonctionnelle du catalogue. Votre projet précise les opérations réellement utiles, les rôles concernés et les étapes à suivre ; les automatismes sont étudiés selon les moteurs disponibles.",
    prepare:
      "Choisissez quelques opérations récurrentes, leurs responsables et les validations attendues.",
    related: ["planning", "qualite", "support"],
    pages: [3, 17],
  },
  {
    key: "rh",
    label: "RH, recrutement & staffing",
    tag: "Équipes",
    summary:
      "De vos besoins de recrutement au suivi des équipes, construisez un cadre commun.",
    benefits: [
      "Gérer les besoins de recrutement",
      "Organiser les plannings et les disponibilités",
      "Suivre les présences et les responsabilités",
    ],
    uses: ["Recrutement", "Personnel", "Planning"],
    detail:
      "Le catalogue présente recrutement, dossiers employés, planning, présence et performance. La démonstration est préparée à partir de votre organisation et des accès autorisés ; les règles RH et les conditions applicables restent à préciser avec vos responsables.",
    prepare:
      "Indiquez les profils, les équipes, les horaires et les responsabilités d’accès à étudier.",
    related: ["formation", "roles", "planning"],
    pages: [15],
  },
  {
    key: "formation",
    label: "Formation & certification",
    tag: "Transmission",
    summary:
      "Donnez une continuité à l’intégration et au développement des compétences.",
    benefits: [
      "Planifier les formations de l’équipe",
      "Suivre les parcours et les validations prévus",
      "Valoriser les compétences internes",
    ],
    uses: ["Parcours", "Compétences", "Évaluations"],
    detail:
      "Parcours, formations, compétences, évaluations et plans de progrès font partie de la carte du catalogue. Les contenus, critères, évaluateurs et conditions de certification doivent être définis pour le parcours retenu ; aucun titre n’est délivré par une simple sélection sur cette page.",
    prepare:
      "Précisez les compétences prioritaires, les publics et les formations déjà utilisées.",
    related: ["rh", "qualite", "documents"],
    pages: [3, 17],
  },
  {
    key: "qualite",
    label: "Qualité, audits & SOP",
    tag: "Pratiques",
    summary:
      "Structurez vos pratiques et préparez les revues internes avec des repères partagés.",
    benefits: [
      "Structurer les procédures et les checklists",
      "Organiser les audits et les contrôles internes",
      "Suivre les actions et les preuves utiles",
    ],
    uses: ["SOP", "Checklists", "Plans d’action"],
    detail:
      "Les supports qualité relient procédures, audits, observations et plans d’action. Ils accompagnent votre préparation interne. Les obligations, contrôles et validations relèvent des autorités et professionnels compétents ; aucun résultat d’inspection n’est garanti.",
    prepare:
      "Identifiez vos référentiels, vos procédures existantes et les revues que vous souhaitez organiser.",
    related: ["operations", "formation", "documents"],
    pages: [3, 17],
  },
  {
    key: "roles",
    label: "Rôles, permissions & sécurité",
    tag: "Responsabilités",
    summary:
      "Définissez qui intervient, ce qui est partagé et les accès nécessaires.",
    benefits: [
      "Définir les rôles et les accès par profil",
      "Préciser les responsabilités de validation",
      "Séparer les usages locaux et ceux du réseau",
    ],
    uses: ["Accès", "Profils", "Validation"],
    detail:
      "La carte fonctionnelle inclut les rôles, permissions et la sécurité. Le projet doit préciser les profils, les droits et la gouvernance des données. Une description commerciale ne remplace pas une revue technique des protections réellement déployées.",
    prepare:
      "Préparez les profils utilisateurs, les responsabilités et les informations à protéger.",
    related: ["sites", "rh", "documents"],
    pages: [3],
  },
  {
    key: "plans",
    label: "Plans, devis & contrats",
    tag: "Commercial",
    summary:
      "Formalisez vos propositions, vos périmètres et les accords avec les familles.",
    benefits: [
      "Préparer des propositions lisibles",
      "Étudier et suivre les accords retenus",
      "Garder un historique clair des conditions",
    ],
    uses: ["Devis", "Forfaits", "Contrats"],
    detail:
      "Le catalogue présente devis, gestion commerciale et forfaits facturables. Les prestations, quantités, durées et conditions sont précisées avant engagement, puis reliées au parcours de facturation approprié.",
    prepare:
      "Décrivez votre offre, vos variantes, les validations et les conditions que vous souhaitez formaliser.",
    related: ["services", "facturation", "admissions"],
    pages: [12],
  },
  {
    key: "services",
    label: "Services activables",
    tag: "Offre",
    summary:
      "Préparez les services utiles à votre établissement et leur place dans votre offre.",
    benefits: [
      "Proposer des services complémentaires",
      "Définir les besoins et les conditions retenues",
      "Suivre le périmètre et la facturation associés",
    ],
    uses: ["Services", "Options", "Périmètre"],
    detail:
      "L’axe services activables organise des prestations complémentaires telles que transport, repas ou activités, selon ce qui est réellement disponible et retenu. Cette page prépare le besoin ; elle n’active pas un service ni une facturation automatiquement.",
    prepare:
      "Sélectionnez les services à étudier, leurs publics, les modalités et les contraintes de fonctionnement.",
    related: ["plans", "facturation", "marketplace"],
    pages: [10],
  },
  {
    key: "facturation",
    label: "Facturation & abonnements",
    tag: "Finance",
    summary:
      "Informez, échelonnez et suivez les factures et abonnements dans leur périmètre.",
    benefits: [
      "Organiser les abonnements et les échéances",
      "Émettre et retrouver les documents de facturation",
      "Suivre le statut des factures",
    ],
    uses: ["Factures", "Abonnements", "Échéances"],
    detail:
      "Facturation et abonnements relient prestations, documents et périodicités. Les règles, taxes, échéances et moyens disponibles sont confirmés selon votre configuration. Les exemples de démonstration ne sont pas des écritures comptables réelles.",
    prepare:
      "Précisez vos périodicités, les prestations facturées et les règles que vous utilisez déjà.",
    related: ["plans", "paiements", "reporting"],
    pages: [13],
  },
  {
    key: "paiements",
    label: "Paiements & relances",
    tag: "Encaissement",
    summary:
      "Suivez les règlements et préparez les relances avec une information cohérente.",
    benefits: [
      "Suivre les règlements et les échéances",
      "Préparer des relances adaptées au contexte",
      "Conserver un historique de suivi",
    ],
    uses: ["Règlements", "Relances", "Historique"],
    detail:
      "Le catalogue distingue paiements, relance et recouvrement. Le parcours doit relier les factures et les règlements disponibles, avec des modalités et des responsabilités convenues. Aucun paiement n’est effectué depuis cette présentation commerciale.",
    prepare:
      "Indiquez vos moyens de règlement, vos étapes de relance et les personnes chargées du suivi.",
    related: ["facturation", "communication", "reporting"],
    pages: [14],
  },
  {
    key: "marketplace",
    label: "Marketplace & add-ons",
    tag: "Évolutivité",
    summary:
      "Enrichissez votre environnement avec un périmètre complémentaire adapté.",
    benefits: [
      "Explorer les modules et services complémentaires",
      "Choisir selon vos usages et votre configuration",
      "Préparer l’évolution de votre environnement",
    ],
    uses: ["Modules", "Services", "Extensions"],
    detail:
      "Le catalogue présente un écosystème de modules et d’extensions. Disponibilité, compatibilité, droits d’utilisation et conditions doivent être confirmés pour votre projet. Une option montrée ici n’est pas présentée comme installée sur votre compte.",
    prepare:
      "Listez les besoins complémentaires et les outils existants dont il faut tenir compte.",
    related: ["services", "roles", "support"],
    pages: [11],
  },
  {
    key: "documents",
    label: "Documents & dossiers",
    tag: "Continuité",
    summary:
      "Rapprochez les documents des étapes et des personnes qui en ont besoin.",
    benefits: [
      "Organiser les pièces et les dossiers",
      "Retrouver les versions et les éléments utiles",
      "Préciser les droits de consultation",
    ],
    uses: ["Dossiers", "Pièces", "Accès"],
    detail:
      "Le suivi documentaire accompagne admissions, équipes, qualité et gestion commerciale. Votre périmètre précise les documents concernés, leur circulation, les validations et les règles de conservation applicables.",
    prepare:
      "Repérez les dossiers récurrents, les pièces requises et les étapes de validation.",
    related: ["admissions", "qualite", "roles"],
    pages: [3, 17],
  },
  {
    key: "support",
    label: "Support & tickets",
    tag: "Accompagnement",
    summary:
      "Préparez un point de suivi pour les demandes et les besoins d’assistance.",
    benefits: [
      "Organiser les demandes de support",
      "Garder un suivi des échanges et des actions",
      "Définir les modalités de l’accompagnement",
    ],
    uses: ["Demandes", "Suivi", "Assistance"],
    detail:
      "Support, tickets et base de connaissances sont présentés dans le catalogue. Les canaux, disponibilités, responsabilités et niveaux d’accompagnement sont précisés dans votre proposition ; aucun délai de réponse garanti n’est inventé ici.",
    prepare:
      "Identifiez les utilisateurs à accompagner, leurs besoins et les conditions d’assistance à étudier.",
    related: ["marketplace", "operations", "formation"],
    pages: [3, 17],
  },
];
export const SITUATIONS = [
  "Une crèche",
  "Une maternelle",
  "Plusieurs sites",
  "Je prépare mon ouverture",
] as const;
export const SITE_COUNTS = [
  "À préciser",
  "1 site",
  "2 à 5 sites",
  "6 sites ou plus",
] as const;
export const PRIORITIES = [
  "À préciser ensemble",
  ...CHAPTERS.map((c) => c.label),
] as const;
export const HORIZONS = [
  "Je me renseigne",
  "Projet sous trois mois",
  "Besoin à étudier rapidement",
] as const;
export type PartnerRequest = {
  modules: ModuleKey[];
  situation: string;
  priority: string;
  sites: string;
  horizon: string;
};
export const EMPTY_PARTNER: PartnerRequest = {
  modules: [],
  situation: SITUATIONS[0],
  priority: PRIORITIES[0],
  sites: SITE_COUNTS[0],
  horizon: HORIZONS[0],
};
/** Language-independent presentation choices; no contact information. */
export type PartnerPresentation = {
  pain: number;
  admissions: number;
  planning: number;
  team: "rh" | "formation" | "qualite" | "roles";
  finance: "plans" | "services" | "facturation" | "paiements";
  all: boolean;
};
export const EMPTY_PRESENTATION: PartnerPresentation = {
  pain: 0,
  admissions: 0,
  planning: 0,
  team: "rh",
  finance: "plans",
  all: false,
};
export function restorePresentation(value: unknown): PartnerPresentation {
  const v =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const index = (key: string, length: number) =>
    typeof v[key] === "number" &&
    Number.isInteger(v[key]) &&
    v[key] >= 0 &&
    v[key] < length
      ? v[key]
      : 0;
  return {
    pain: index("pain", 3),
    admissions: index("admissions", 4),
    planning: index("planning", 3),
    team:
      (["rh", "formation", "qualite", "roles"] as const).find(
        (key) => key === v.team,
      ) || "rh",
    finance:
      (["plans", "services", "facturation", "paiements"] as const).find(
        (key) => key === v.finance,
      ) || "plans",
    all: v.all === true,
  };
}
export function moduleByKey(key: ModuleKey) {
  return MODULES.find((m) => m.key === key)!;
}
export function chapterFor(key: ModuleKey) {
  return CHAPTERS.find((c) => (c.modules as readonly string[]).includes(key))!;
}
export function restorePartner(value: unknown): PartnerRequest {
  const v =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const choice = (key: string, allowed: readonly string[], fallback: string) =>
    typeof v[key] === "string" && allowed.includes(v[key] as string)
      ? (v[key] as string)
      : fallback;
  return {
    modules: MODULES.filter(
      (m) => Array.isArray(v.modules) && v.modules.includes(m.key),
    ).map((m) => m.key),
    situation: choice("situation", SITUATIONS, EMPTY_PARTNER.situation),
    priority: choice("priority", PRIORITIES, EMPTY_PARTNER.priority),
    sites: choice("sites", SITE_COUNTS, EMPTY_PARTNER.sites),
    horizon: choice("horizon", HORIZONS, EMPTY_PARTNER.horizon),
  };
}
export function recommended(request: PartnerRequest): ModuleKey[] {
  if (request.situation === SITUATIONS[2])
    return ["sites", "direction", "roles", "reporting"];
  if (request.situation === SITUATIONS[3])
    return ["admissions", "plans", "rh", "planning"];
  if (request.situation === SITUATIONS[1])
    return ["planning", "communication", "parents", "formation"];
  return ["admissions", "parents", "planning", "rh"];
}
export function toggleModule(
  r: PartnerRequest,
  key: ModuleKey,
): PartnerRequest {
  return {
    ...r,
    modules: r.modules.includes(key)
      ? r.modules.filter((k) => k !== key)
      : [...r.modules, key],
  };
}
export function partnerBrief(
  r: PartnerRequest,
  t: (s: string) => string = (s) => s,
) {
  return [
    t("Projet Partner OS"),
    `${t("Votre situation")} : ${t(r.situation)}`,
    `${t("Votre priorité")} : ${t(r.priority)}`,
    `${t("Nombre de sites")} : ${t(r.sites)}`,
    `${t("Votre horizon")} : ${t(r.horizon)}`,
    `${t("Domaines retenus")} : ${r.modules.map((key) => t(moduleByKey(key).label)).join(" · ") || t("À préciser ensemble")}`,
  ].join("\n");
}
export const FAQ = [
  [
    "Dois-je sélectionner tous les modules ?",
    "Non. Les domaines préparent votre échange. Vous pouvez ajouter, retirer et combiner librement les capacités à étudier. Le périmètre réellement retenu est précisé dans votre proposition.",
  ],
  [
    "La plateforme convient-elle à plusieurs sites ?",
    "Le catalogue prévoit une lecture par établissement et une vue groupe. Le nombre de sites, la gouvernance et les accès sont étudiés selon votre organisation.",
  ],
  [
    "Peut-on partir de notre organisation actuelle ?",
    "Oui. Présentez vos étapes, vos outils et vos contraintes. La démonstration doit expliquer comment préparer votre périmètre ; une migration ou une intégration nécessite une vérification spécifique.",
  ],
  [
    "Comment préparer la démonstration ?",
    "Choisissez votre situation et vos domaines prioritaires. Vos choix sont joints au formulaire. Une précision complémentaire reste facultative si le contexte préparé suffit.",
  ],
  [
    "Quelles sont les étapes de mise en route ?",
    "Vos priorités, le périmètre, les accès et les besoins d’accompagnement sont précisés avant une proposition. Les modalités et le calendrier de mise en route sont ensuite convenus.",
  ],
  [
    "Quelles sont les conditions de la proposition ?",
    "Les fonctions retenues, les services, les éventuels abonnements, la disponibilité et les conditions d’accompagnement sont confirmés avant engagement. Cette demande ne déclenche aucun achat.",
  ],
] as const;
