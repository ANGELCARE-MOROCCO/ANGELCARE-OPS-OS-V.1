import type { ContractExperienceKey } from "./types"

export type ContractRouteContract = {
  key: ContractExperienceKey
  eyebrow: string
  title: string
  mission: string
  primaryAction: string
  archetype: "command" | "portfolio" | "studio" | "activation" | "dossier" | "system"
  accent: "navy" | "blue" | "red" | "amber" | "green" | "violet"
}

export const CONTRACT_ROUTE_CONTRACTS: Record<ContractExperienceKey, ContractRouteContract> = {
  "contract-command": { key:"contract-command", eyebrow:"CLOSING & REVENUE CONTROL", title:"Centre de commandement contractuel", mission:"Transformer les positions commerciales acceptées en contrats gouvernés, signés, financés et activables sans perte de traçabilité.", primaryAction:"Créer un contrat", archetype:"command", accent:"navy" },
  "contract-portfolio": { key:"contract-portfolio", eyebrow:"AGREEMENTS PORTFOLIO", title:"Portefeuille des contrats & accords", mission:"Contrôler préparation, revue, signature, paiement, activation, obligations et échéances dans une vue institutionnelle unique.", primaryAction:"Préparer un accord", archetype:"portfolio", accent:"blue" },
  "contract-studio": { key:"contract-studio", eyebrow:"CONTRACT STUDIO", title:"Dossier contractuel & studio d’accord", mission:"Composer les clauses, obligations, conditions financières, signataires et gates d’effectivité du contrat exact.", primaryAction:"Composer le contrat", archetype:"studio", accent:"violet" },
  "activation-command": { key:"activation-command", eyebrow:"ACTIVATION & PAYMENT GATES", title:"Commandement des activations partenaires", mission:"Vérifier signatures, conditions, paiement, preuves et handoff avant toute mise en service partenariale.", primaryAction:"Évaluer les gates", archetype:"activation", accent:"green" },
  "activation-dossier": { key:"activation-dossier", eyebrow:"ACTIVATION DOSSIER", title:"Dossier d’activation contractuelle", mission:"Piloter les conditions, le paiement, le handoff opérationnel et la réalisation du revenu pour un accord précis.", primaryAction:"Contrôler l’activation", archetype:"dossier", accent:"amber" },
  "system-activation": { key:"system-activation", eyebrow:"EXECUTIVE ACTIVATION AUTHORITY", title:"Autorité centrale d’activation & réalisation", mission:"Bloquer toute activation non autorisée, exposer le revenu empêché et valider les exceptions avec preuve et autorité.", primaryAction:"Lancer l’évaluation centrale", archetype:"system", accent:"red" },
}

export const CONTRACT_NAVIGATION = [
  ["Commandement", "/revenue-command-center/documents"],
  ["Contrats", "/revenue-command-center/partnerships/agreements"],
  ["Activation", "/revenue-command-center/partnerships/activation"],
  ["Autorité centrale", "/revenue-command-center/system-activation"],
] as const
