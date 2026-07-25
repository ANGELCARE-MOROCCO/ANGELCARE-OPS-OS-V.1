import type { ProposalExperienceKey } from "./types"

export type ProposalRouteContract = {
  key: ProposalExperienceKey
  eyebrow: string
  title: string
  mission: string
  primaryAction: string
  primaryHref?: string
  archetype: "command" | "studio" | "dossier" | "negotiation" | "portfolio" | "quote"
  accent: "navy" | "blue" | "red" | "amber" | "green" | "violet"
}

export const PROPOSAL_ROUTE_CONTRACTS: Record<ProposalExperienceKey, ProposalRouteContract> = {
  "proposal-command": { key:"proposal-command", eyebrow:"OFFRES & VALEUR", title:"Centre de commandement des propositions", mission:"Transformer les opportunités qualifiées en offres structurées, approuvées, envoyées et commercialement défendables.", primaryAction:"Créer une proposition", archetype:"command", accent:"navy" },
  "proposal-dossier": { key:"proposal-dossier", eyebrow:"PROPOSAL STUDIO", title:"Dossier commercial & proposition", mission:"Composer l’offre, protéger la marge, gouverner les versions et préparer une transmission traçable.", primaryAction:"Créer ou réviser l’offre", archetype:"dossier", accent:"blue" },
  "negotiation-command": { key:"negotiation-command", eyebrow:"NEGOTIATION COMMAND", title:"Commandement des négociations", mission:"Piloter objections, contre-offres, concessions, délais et exposition financière sans perdre l’historique.", primaryAction:"Ouvrir une négociation", archetype:"command", accent:"red" },
  "negotiation-room": { key:"negotiation-room", eyebrow:"DEAL ROOM", title:"Salle de négociation commerciale", mission:"Confronter les positions, mesurer chaque concession et sécuriser la décision finale exacte.", primaryAction:"Enregistrer une position", archetype:"negotiation", accent:"violet" },
  "partnership-proposals": { key:"partnership-proposals", eyebrow:"PARTENARIATS", title:"Portefeuille des offres partenaires", mission:"Structurer les programmes, bénéfices, obligations et valeurs proposés aux partenaires stratégiques.", primaryAction:"Préparer une offre partenaire", archetype:"portfolio", accent:"green" },
  "partnership-proposal-dossier": { key:"partnership-proposal-dossier", eyebrow:"OFFRE PARTENAIRE", title:"Studio de proposition partenariale", mission:"Formaliser la valeur mutuelle, les bénéfices, les obligations et les conditions de réussite du partenariat.", primaryAction:"Composer la proposition", archetype:"studio", accent:"green" },
  "b2c-quotes": { key:"b2c-quotes", eyebrow:"DEVIS FAMILLES", title:"Commandement des devis B2C", mission:"Convertir les besoins familles en devis transparents, cohérents, suivis et prêts pour l’activation.", primaryAction:"Créer un devis", archetype:"quote", accent:"amber" },
  "b2c-quote-dossier": { key:"b2c-quote-dossier", eyebrow:"DEVIS PERSONNALISÉ", title:"Studio de devis famille", mission:"Composer une solution de service claire, protéger la cohérence tarifaire et suivre la décision familiale.", primaryAction:"Préparer le devis", archetype:"studio", accent:"amber" },
}

export const PROPOSAL_NAVIGATION = [
  ["Propositions", "/revenue-command-center/prospects/proposals"],
  ["Négociations", "/revenue-command-center/prospects/negotiation"],
  ["Partenaires", "/revenue-command-center/partnerships/proposals"],
  ["Devis B2C", "/revenue-command-center/b2c-workflow/quote"],
] as const
