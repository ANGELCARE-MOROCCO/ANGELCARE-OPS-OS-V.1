export type View = "conseil" | "partner-os" | "produits";
export type Family = "edup" | "academy" | "parents";
export { CAMPAIGN_ROOT as ASSET_ROOT, campaignAsset as asset } from "./media";
export const VIEWS: {
  key: View;
  label: string;
  title: string;
  lead: string;
  image: string;
}[] = [
  {
    key: "conseil",
    label: "Conseil & programmes",
    title: "Faites de votre établissement une référence.",
    lead: "Expérience enfant, équipes professionnelles, confiance des parents : trois leviers pour rendre votre différence visible.",
    image: "consulting-hero",
  },
  {
    key: "partner-os",
    label: "Partner OS",
    title: "Votre établissement avance. Votre gestion aussi.",
    lead: "Admissions, familles, équipes et opérations : reliez ce qui fait vivre votre établissement.",
    image: "partner-hero",
  },
  {
    key: "produits",
    label: "Produits & équipements",
    title: "Faites de chaque détail une différence.",
    lead: "Des produits et équipements pensés pour vos espaces, vos équipes et vos familles.",
    image: "products-hero",
  },
];
export const FAMILIES: {
  key: Family;
  name: string;
  purpose: string;
  image: string;
}[] = [
  {
    key: "edup",
    name: "EduPlay",
    purpose: "Enrichir l’expérience enfant",
    image: "edupplay",
  },
  {
    key: "academy",
    name: "Academy Pro",
    purpose: "Renforcer les pratiques d’équipe",
    image: "academy",
  },
  {
    key: "parents",
    name: "ParentTrust",
    purpose: "Consolider la relation parents",
    image: "parents",
  },
];
export interface Formula {
  id: string;
  family: Family;
  name: string;
  amount: number;
  unit: string;
  frequency: string;
  volume: string;
  reporting: string;
  support: string;
  facts: string[];
}
export const FORMULAS: Formula[] = [
  {
    id: "eduplay-start",
    family: "edup",
    name: "EduPlay Start",
    amount: 2900,
    unit: "mois",
    frequency: "1 atelier / semaine",
    volume: "4 interventions / mois",
    reporting: "Mini-reporting",
    support: "Support de communication parents",
    facts: [
      "Thème mensuel",
      "Mini-reporting",
      "Support simple pour communiquer aux parents",
    ],
  },
  {
    id: "eduplay-growth",
    family: "edup",
    name: "EduPlay Growth",
    amount: 5900,
    unit: "mois",
    frequency: "2 ateliers / semaine",
    volume: "8 interventions / mois",
    reporting: "Reporting mensuel",
    support: "Coordination avec la direction",
    facts: [
      "Planning structuré",
      "Activités variées",
      "Contenus parents",
      "Coordination avec la direction",
    ],
  },
  {
    id: "eduplay-signature",
    family: "edup",
    name: "EduPlay Signature",
    amount: 9800,
    unit: "mois",
    frequency: "3 ateliers / semaine",
    volume: "12 interventions / mois",
    reporting: "Reporting enrichi",
    support: "Réunion mensuelle direction",
    facts: [
      "Calendrier thématique complet",
      "Temps forts événementiels",
      "Reporting enrichi",
      "Réunion mensuelle avec la direction",
    ],
  },
  {
    id: "academy-start",
    family: "academy",
    name: "Academy Start",
    amount: 3500,
    unit: "session",
    frequency: "1 session ciblée",
    volume: "Une compétence prioritaire",
    reporting: "Recommandations pratiques",
    support: "Mise en situation et Q&A équipe",
    facts: [
      "Support PDF",
      "Mise en situation",
      "Q&A équipe",
      "Recommandations pratiques",
    ],
  },
  {
    id: "academy-team",
    family: "academy",
    name: "Academy Team",
    amount: 8500,
    unit: "programme",
    frequency: "3 sessions",
    volume: "Exercices terrain",
    reporting: "Synthèse direction",
    support: "Outils d’encadrement",
    facts: [
      "Évaluation simple",
      "Outils d’encadrement",
      "Attestation de participation",
      "Synthèse direction",
    ],
  },
  {
    id: "academy-excellence",
    family: "academy",
    name: "Academy Excellence",
    amount: 16000,
    unit: "parcours",
    frequency: "6 sessions",
    volume: "Diagnostic équipe et coaching",
    reporting: "Rapport complet",
    support: "Coaching pédagogique",
    facts: [
      "Diagnostic équipe",
      "Coaching pédagogique",
      "Kit qualité",
      "Évaluation finale",
      "Recommandations d’amélioration continue",
    ],
  },
  {
    id: "parenttrust-visibility",
    family: "parents",
    name: "ParentTrust Visibility",
    amount: 4500,
    unit: "mois",
    frequency: "1 atelier parents / mois",
    volume: "Supports de communication",
    reporting: "Mini-rapport satisfaction",
    support: "Conseils famille-école",
    facts: [
      "Supports de communication",
      "Valorisation des actions",
      "Mini-rapport satisfaction",
      "Conseils communication famille-école",
    ],
  },
  {
    id: "parenttrust-performance",
    family: "parents",
    name: "ParentTrust Performance",
    amount: 9500,
    unit: "mois",
    frequency: "2 actions parentales / mois",
    volume: "Audit simple expérience parent",
    reporting: "Tableau de suivi satisfaction",
    support: "Optimisation du parcours d’accueil",
    facts: [
      "Audit simple expérience parent",
      "Optimisation du parcours d’accueil",
      "Supports pédagogiques parents",
      "Suivi satisfaction",
    ],
  },
  {
    id: "parenttrust-360",
    family: "parents",
    name: "ParentTrust 360",
    amount: 18000,
    unit: "mois",
    frequency: "Pilotage global expérience famille",
    volume: "Calendrier annuel d’actions",
    reporting: "Reporting mensuel complet",
    support: "Accompagnement stratégique direction",
    facts: [
      "Ateliers parents et événements",
      "Accompagnement stratégique direction",
      "Co-construction d’offres premium",
      "Suivi satisfaction et fidélisation",
    ],
  },
];
export const PROGRAMME_STORIES = [
  {
    family: "edup",
    title: "Enrichir l’expérience enfant. Rendre la pédagogie visible.",
    text: "Des ateliers organisés, des thèmes et des supports qui donnent une continuité aux expériences proposées. Rendez les activités lisibles et partagez des traces utiles avec les familles.",
    image: "child-experience",
    points: [
      "Activités structurées",
      "Planning et thèmes",
      "Valorisation et reporting",
    ],
    deliverables: [
      "Calendrier d’ateliers",
      "Supports d’activités",
      "Mini-report ou reporting selon formule",
    ],
  },
  {
    family: "academy",
    title: "Une belle crèche attire. Une équipe professionnelle fidélise.",
    text: "Posture, hygiène, vigilance, gestion des incidents et communication parents : travaillez les pratiques du terrain avec des mises en situation et un accompagnement selon la formule.",
    image: "academy",
    points: [
      "Exercices terrain",
      "Évaluation des pratiques",
      "Coaching selon formule",
    ],
    deliverables: [
      "Supports de formation",
      "Fiche de compétences",
      "Synthèse direction",
    ],
  },
  {
    family: "parents",
    title: "La confiance se construit avant qu’un problème n’arrive.",
    text: "Un accueil cohérent, une communication claire et un suivi régulier rendent la relation famille-école plus lisible. Structurez les actions et les supports selon votre contexte.",
    image: "parents",
    points: [
      "Accueillir avec cohérence",
      "Communiquer clairement",
      "Suivre la relation",
    ],
    deliverables: [
      "Supports de communication",
      "Actions parents",
      "Reporting selon formule",
    ],
  },
] as const;
export interface Universe {
  title: string;
  text: string;
}
export const PRODUCT_CHAPTERS: {
  title: string;
  image: string;
  detail: string;
  universes: Universe[];
}[] = [
  {
    title: "Faire une première impression qui compte.",
    image: "welcome",
    detail: "signage",
    universes: [
      {
        title: "Accueil & identité",
        text: "Donnez aux familles des repères clairs dès leur arrivée : supports d’accueil et identité visuelle cohérente.",
      },
      {
        title: "Photo booths & souvenirs",
        text: "Transformez les moments de rencontre en souvenirs tangibles avec des supports dédiés.",
      },
      {
        title: "Signalétique & grands formats",
        text: "Rendez vos espaces lisibles et votre présence visible avec panneaux, bâches et orientations harmonisées.",
      },
      {
        title: "Événements & cérémonies",
        text: "Préparez des temps forts qui portent votre signature, au-delà d’une décoration improvisée.",
      },
    ],
  },
  {
    title: "Donner à la pédagogie un cadre visible.",
    image: "classroom",
    detail: "activities",
    universes: [
      {
        title: "Visuels & routines de classe",
        text: "Alphabet, émotions et routines rendent les apprentissages plus lisibles.",
      },
      {
        title: "Imprimables & activités",
        text: "Graphisme, pré-écriture et motricité fine : des ressources structurées pour enrichir les séances.",
      },
      {
        title: "Mobilier & aménagement",
        text: "Tables, assises et rangements servent les usages, la circulation et l’autonomie.",
      },
      {
        title: "Inclusion & besoins spécifiques",
        text: "Appuyez un accompagnement adapté sur des routines visuelles, cartes émotions et outils d’observation.",
      },
    ],
  },
  {
    title: "Organiser le quotidien. Rassurer les familles.",
    image: "administration",
    detail: "parent-tools",
    universes: [
      {
        title: "Administration & inscriptions",
        text: "Registres et dossiers communs structurent l’accueil et rassemblent les informations utiles.",
      },
      {
        title: "Hygiène & routines",
        text: "Des consignes visibles et des supports concrets aident les équipes à partager les bons repères.",
      },
      {
        title: "Sécurité & départs",
        text: "Clarifiez les autorisations et les responsabilités grâce à des outils de suivi adaptés.",
      },
      {
        title: "Communication & suivi parents",
        text: "Rapports et portfolios rendent la continuité école-famille plus claire.",
      },
    ],
  },
  {
    title: "Professionnaliser l’équipe. Structurer les preuves.",
    image: "uniforms",
    detail: "audit",
    universes: [
      {
        title: "Uniformes & identité d’équipe",
        text: "Une tenue cohérente et des badges lisibles renforcent la présence professionnelle.",
      },
      {
        title: "Formation & outils d’équipe",
        text: "Planners et grilles de suivi donnent des repères partagés aux pratiques.",
      },
      {
        title: "Conformité & préparation aux audits",
        text: "Rassemblez les pièces et documents utiles pour mieux préparer les contrôles.",
      },
      {
        title: "Gouvernance & traçabilité",
        text: "Organisez registres, responsabilités et échéances pour retrouver les informations.",
      },
    ],
  },
];
export interface Module {
  id: string;
  title: string;
  text: string;
  image: string;
  group: string;
}
export const MODULES: Module[] = [
  {
    id: "direction",
    title: "Direction & vue d’ensemble",
    text: "Rassemblez les informations clés pour orienter vos décisions.",
    image: "os-overview",
    group: "Piloter",
  },
  {
    id: "multi",
    title: "Multi-établissements",
    text: "Reliez vos sites tout en gardant une lecture de chacun.",
    image: "os-overview",
    group: "Piloter",
  },
  {
    id: "reporting",
    title: "Reporting, KPI & tableaux de bord",
    text: "Partagez une lecture de l’activité et de ses indicateurs.",
    image: "os-overview",
    group: "Piloter",
  },
  {
    id: "roles",
    title: "Rôles, permissions & sécurité",
    text: "Organisez les responsabilités et les accès selon les usages.",
    image: "os-overview",
    group: "Piloter",
  },
  {
    id: "admissions",
    title: "Admissions & inscriptions",
    text: "Centralisez les dossiers, les étapes et les prochaines actions.",
    image: "os-admissions",
    group: "Accueillir",
  },
  {
    id: "crm",
    title: "CRM parents & leads",
    text: "Structurez les contacts, les rendez-vous et le suivi commercial.",
    image: "os-crm",
    group: "Accueillir",
  },
  {
    id: "experience",
    title: "Expérience parent",
    text: "Donnez de la cohérence aux échanges et au parcours des familles.",
    image: "os-crm",
    group: "Accueillir",
  },
  {
    id: "communication",
    title: "Communication & messagerie",
    text: "Retrouvez les échanges et transmettez les informations utiles.",
    image: "os-communication",
    group: "Accueillir",
  },
  {
    id: "services",
    title: "Services activables",
    text: "Présentez les services adaptés à votre établissement.",
    image: "os-services",
    group: "Commercialiser",
  },
  {
    id: "marketplace",
    title: "Marketplace & add-ons",
    text: "Faites évoluer votre environnement selon vos besoins et votre plan.",
    image: "os-services",
    group: "Commercialiser",
  },
  {
    id: "devis",
    title: "Plans, devis & contrats",
    text: "Formalisez les propositions et gardez une trace du parcours commercial.",
    image: "os-quotes",
    group: "Commercialiser",
  },
  {
    id: "facturation",
    title: "Facturation & abonnements",
    text: "Structurez les échéances, les documents et le suivi de facturation.",
    image: "os-finance",
    group: "Commercialiser",
  },
  {
    id: "rh",
    title: "RH, recrutement & staffing",
    text: "Reliez les besoins, les profils et les affectations.",
    image: "os-team",
    group: "Organiser",
  },
  {
    id: "formation",
    title: "Formation & certification",
    text: "Organisez les parcours de montée en compétences et leur suivi.",
    image: "academy",
    group: "Organiser",
  },
  {
    id: "operations",
    title: "Opérations & missions",
    text: "Clarifiez ce qui doit être fait, par qui et dans quel contexte.",
    image: "os-team",
    group: "Organiser",
  },
  {
    id: "calendrier",
    title: "Calendrier & planification",
    text: "Donnez une vue commune aux activités et aux engagements.",
    image: "os-activities",
    group: "Organiser",
  },
  {
    id: "paiements",
    title: "Paiements & relances",
    text: "Gardez une lecture des règlements attendus et des suivis nécessaires.",
    image: "os-payments",
    group: "Suivre",
  },
  {
    id: "qualite",
    title: "Qualité, audits & SOP",
    text: "Rassemblez procédures et éléments utiles au suivi qualité.",
    image: "audit",
    group: "Suivre",
  },
  {
    id: "support",
    title: "Support & tickets",
    text: "Structurez les demandes et leur traitement.",
    image: "os-communication",
    group: "Suivre",
  },
  {
    id: "documents",
    title: "Documents & dossiers",
    text: "Classez et retrouvez les pièces liées à vos opérations.",
    image: "administration",
    group: "Suivre",
  },
];
export const METHOD = [
  ["Diagnostic", "Comprendre votre contexte, vos enjeux et vos objectifs."],
  ["Priorités", "Cibler les besoins et définir les résultats recherchés."],
  ["Proposition", "Préciser le périmètre, les formules et les livrables."],
  ["Déploiement", "Organiser les interventions et la coordination."],
  ["Suivi", "Partager les actions réalisées et les pistes de continuité."],
] as const;

export const FORMULA_IMAGES: Record<string, string> = {
  "eduplay-start": "child-experience",
  "eduplay-growth": "edupplay",
  "eduplay-signature": "consulting-hero",
  "academy-start": "programme-team",
  "academy-team": "academy",
  "academy-excellence": "programme-coaching",
  "parenttrust-visibility": "parents",
  "parenttrust-performance": "parent-direction",
  "parenttrust-360": "consulting-method",
};
export const LEVELS = [
  { key: "all", label: "Tous les niveaux" },
  { key: "0", label: "Démarrer" },
  { key: "1", label: "Structurer" },
  { key: "2", label: "Approfondir" },
];
export function formulaLevel(formula: Formula): string {
  return String(
    FORMULAS.filter((item) => item.family === formula.family).findIndex(
      (item) => item.id === formula.id,
    ),
  );
}
