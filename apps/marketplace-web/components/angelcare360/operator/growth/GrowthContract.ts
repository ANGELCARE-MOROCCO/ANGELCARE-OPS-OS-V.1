import type { GrowthMode } from '@/types/angelcare360/operator/growth'

export const GROWTH_MODES: Array<{ key: GrowthMode; label: string; short: string; signal: string }> = [
  { key: 'command', label: 'Revenue Command', short: 'Revenue Command', signal: 'Valeur, risques & décisions' },
  { key: 'markets', label: 'Markets & Accounts', short: 'Marchés & comptes', signal: 'Ciblage, qualification & influence' },
  { key: 'pipeline', label: 'Pipeline & Deals', short: 'Pipeline & deals', signal: 'Missions commerciales & forecast' },
  { key: 'offers', label: 'Offers & Negotiation', short: 'Offres & négociation', signal: 'Solution, valeur & concessions' },
  { key: 'contracts', label: 'Contracts & Activation', short: 'Contrats & activation', signal: 'Obligations, abonnement & go-live' },
  { key: 'portfolio', label: 'Customer Portfolio', short: 'Portefeuille clients', signal: 'Relations, valeur & expansion' },
  { key: 'health', label: 'Retention, Support & Recovery', short: 'Rétention & recovery', signal: 'Tickets, plaintes & rétablissement' },
  { key: 'performance', label: 'Revenue Performance', short: 'Performance revenu', signal: 'Conversion, rétention & exécution' },
]

export const OPPORTUNITY_STAGES = [
  'identified', 'qualified', 'discovery', 'solution_design', 'offer_preparation',
  'proposal_submitted', 'negotiation', 'decision', 'contracting', 'won', 'lost',
] as const

export const OPPORTUNITY_STAGE_LABELS: Record<string, string> = {
  identified: 'Identifiée', qualified: 'Qualifiée', discovery: 'Découverte', solution_design: 'Ingénierie solution',
  offer_preparation: 'Préparation offre', proposal_submitted: 'Proposition soumise', negotiation: 'Négociation',
  decision: 'Décision finale', contracting: 'Contractualisation', won: 'Gagnée', lost: 'Perdue',
}

export const OFFER_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', solution_review: 'Revue solution', internal_review: 'Revue interne', pricing_review: 'Revue tarifaire', management_approval: 'Approbation direction', approved: 'Approuvée',
  submitted: 'Soumise', customer_review: 'Revue client', negotiation: 'Négociation', revised: 'Révisée', accepted: 'Acceptée', rejected: 'Rejetée', expired: 'Expirée', converted: 'Convertie', archived: 'Archivée',
}

export const CASE_STATUS_LABELS: Record<string, string> = {
  received: 'Reçu', triage: 'Triage', qualified: 'Qualifié', assigned: 'Assigné', investigation: 'Investigation',
  waiting_customer: 'Attente client', waiting_internal: 'Attente interne', escalated: 'Escaladé', resolution_proposed: 'Résolution proposée',
  customer_validation: 'Validation client', resolved: 'Résolu', closed: 'Clos', reopened: 'Réouvert', archived: 'Archivé',
}

export const CASE_TYPE_LABELS: Record<string, string> = {
  support_ticket: 'Ticket support', complaint: 'Réclamation', service_request: 'Demande de service', incident: 'Incident',
  product_problem: 'Problème produit', billing_complaint: 'Réclamation facturation', relationship_complaint: 'Réclamation relationnelle', implementation_issue: 'Problème implémentation',
}

export const CUSTOMER_DOSSIER_SECTIONS = [
  ['overview', 'Command Overview'],
  ['identity', 'Identité & gouvernance'],
  ['influence', 'Contacts & influence'],
  ['institutions', 'Institutions & empreinte'],
  ['strategy', 'Stratégie commerciale'],
  ['offers', 'Offres & négociations'],
  ['contracts', 'Contrats & abonnements'],
  ['product', 'Tenants & produit'],
  ['finance', 'Finance & exposition'],
  ['correspondence', 'Emails & correspondance'],
  ['cases', 'Support & réclamations'],
  ['service', 'Service & expérience'],
  ['renewal', 'Renouvellement & expansion'],
  ['audit', 'Documents & audit'],
] as const

export const GROWTH_FORM_CATALOGUES = {
  clientTypes: ['school', 'preschool', 'kindergarten', 'school_group', 'company', 'partner', 'public_institution'],
  clientStatuses: ['prospect', 'active', 'pilot', 'suspended', 'inactive', 'archived'],
  lifecycleStages: ['prospect', 'qualified', 'contracted', 'onboarding', 'implementation', 'operational', 'expansion', 'renewal'],
  healthStatuses: ['new', 'healthy', 'watch', 'at_risk', 'critical', 'recovering'],
  riskLevels: ['low', 'medium', 'high', 'critical'],
  organizationTypes: ['Crèche privée', 'École privée', 'Groupe scolaire', 'Institution publique', 'Partenaire', 'Entreprise'],
  prospectStatuses: ['new', 'researching', 'contacted', 'qualified', 'disqualified', 'converted', 'archived'],
  qualificationStages: ['target', 'identified', 'contacted', 'discovery', 'qualified', 'nurturing'],
  contactRoles: ['owner', 'director', 'finance_authority', 'contract_authority', 'school_admin', 'operational_admin', 'renewal_decision_maker', 'influencer', 'champion', 'opponent', 'adviser'],
  influenceLevels: ['low', 'medium', 'high', 'critical'],
  decisionAuthority: ['none', 'influencer', 'recommender', 'co_decider', 'final_authority'],
  relationshipStrength: ['unknown', 'weak', 'developing', 'strong', 'trusted'],
  positions: ['supporter', 'neutral', 'undecided', 'skeptical', 'opposed'],
  offerStatuses: Object.keys(OFFER_STATUS_LABELS),
  interventionTypes: ['customer_health_recovery', 'executive_engagement', 'payment_risk', 'product_adoption', 'service_recovery', 'renewal_rescue', 'relationship_repair', 'expansion_preparation'],
  expansionTypes: ['additional_institution', 'additional_tenant', 'package_upgrade', 'new_module', 'premium_feature', 'capacity', 'addon', 'support_upgrade', 'training', 'implementation_service'],
  priorities: ['low', 'normal', 'high', 'urgent'],
  caseTypes: Object.keys(CASE_TYPE_LABELS),
  caseStatuses: Object.keys(CASE_STATUS_LABELS),
  caseSeverities: ['low', 'medium', 'high', 'critical'],
  caseChannels: ['portal', 'email', 'phone', 'whatsapp', 'meeting', 'internal', 'monitoring'],
  institutionTypes: ['school', 'preschool', 'kindergarten', 'campus', 'headquarters', 'branch', 'training_center'],
  negotiationEvents: ['customer_request', 'objection', 'concession_request', 'counter_offer', 'pricing_boundary', 'meeting', 'decision', 'follow_up'],
}

export function modeHref(mode: GrowthMode) {
  return `/angelcare-360-operator/growth?view=${mode}`
}

export function normalizeGrowthMode(value: string | null | undefined): GrowthMode {
  const compatibility: Record<string, GrowthMode> = { contacts: 'portfolio', renewals: 'portfolio' }
  const normalized = compatibility[value || ''] || value
  return GROWTH_MODES.some((item) => item.key === normalized) ? normalized as GrowthMode : 'command'
}
