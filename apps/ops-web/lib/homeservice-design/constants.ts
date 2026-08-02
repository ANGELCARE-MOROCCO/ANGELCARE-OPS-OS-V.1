import type { HsdStatus } from '@/types/homeservice-design'

export const HSD_TENANT_ID = 'angelcare-main'
export const HSD_ROUTE_ROOT = '/carelink-ops/service-design'
export const HSD_TABLE_PREFIX = 'hsd_'

export const HSD_MASTER_UNIVERSES = [
  { key: 'command', label: 'Command', href: HSD_ROUTE_ROOT, description: 'Pilotage exécutif, décisions, risques et pression de préparation.' },
  { key: 'catalogue', label: 'Catalogue services', href: `${HSD_ROUTE_ROOT}/catalogue`, description: 'Familles, catégories, références, versions et dossiers techniques.' },
  { key: 'standards', label: 'Standards & capacités', href: `${HSD_ROUTE_ROOT}/standards`, description: 'Doctrine, capacité, activités, compétences, sécurité et imports.' },
  { key: 'planning', label: 'Mission Plan Studio', href: `${HSD_ROUTE_ROOT}/planning`, description: 'Préparation de l’architecture de planification technique UMZ2.' },
  { key: 'offers', label: 'Offres & bundles', href: `${HSD_ROUTE_ROOT}/offers`, description: 'Architecture commerciale, tarification et composition UMZ3.' },
  { key: 'vitrine', label: 'Vitrine vendable', href: `${HSD_ROUTE_ROOT}/vitrine`, description: 'Références validées, versionnées et prêtes pour CARELINK.' },
] as const

export const HSD_CONTEXT_NAV = {
  command: [
    { label: 'Vue exécutive', href: HSD_ROUTE_ROOT },
    { label: 'Intelligence exécutive', href: `${HSD_ROUTE_ROOT}/performance` },
    { label: 'Plan vs Actual', href: `${HSD_ROUTE_ROOT}/performance/missions` },
    { label: 'Expérience client', href: `${HSD_ROUTE_ROOT}/customer-experience` },
    { label: 'Qualité & évolution', href: `${HSD_ROUTE_ROOT}/quality/signals` },
    { label: 'Santé opérationnelle', href: `${HSD_ROUTE_ROOT}/operations/health` },
    { label: 'Readiness', href: `${HSD_ROUTE_ROOT}/operations/readiness` },
    { label: 'Validations', href: `${HSD_ROUTE_ROOT}/command/approvals` },
    { label: 'Recherche', href: `${HSD_ROUTE_ROOT}/command/search` },
    { label: 'Audit', href: `${HSD_ROUTE_ROOT}/command/audit` },
  ],
  catalogue: [
    { label: 'Paysage portefeuille', href: `${HSD_ROUTE_ROOT}/catalogue` },
    { label: 'Taxonomie', href: `${HSD_ROUTE_ROOT}/catalogue/taxonomy` },
    { label: 'Catégories', href: `${HSD_ROUTE_ROOT}/catalogue/categories` },
  ],
  standards: [
    { label: 'Centre standards', href: `${HSD_ROUTE_ROOT}/standards` },
    { label: 'Doctrine', href: `${HSD_ROUTE_ROOT}/standards/doctrine` },
    { label: 'Capacité', href: `${HSD_ROUTE_ROOT}/standards/capacity` },
    { label: 'Activités', href: `${HSD_ROUTE_ROOT}/standards/activities` },
    { label: 'Compétences', href: `${HSD_ROUTE_ROOT}/standards/staffing` },
    { label: 'Sécurité', href: `${HSD_ROUTE_ROOT}/standards/safety` },
    { label: 'Imports CSV', href: `${HSD_ROUTE_ROOT}/standards/imports` },
  ],
  planning: [{ label: 'Runway de planification', href: `${HSD_ROUTE_ROOT}/planning` }],
  offers: [{ label: 'Runway commercial', href: `${HSD_ROUTE_ROOT}/offers` }],
  vitrine: [
    { label: 'Vitrine B2C', href: `${HSD_ROUTE_ROOT}/vitrine` },
    { label: 'Vitrine B2B', href: `${HSD_ROUTE_ROOT}/vitrine/b2b` },
    { label: 'Handoffs CARELINK', href: `${HSD_ROUTE_ROOT}/handoffs` },
    { label: 'Préflight', href: `${HSD_ROUTE_ROOT}/handoffs/preflight` },
    { label: 'Ledger', href: `${HSD_ROUTE_ROOT}/handoffs/ledger` },
    { label: 'Réconciliation', href: `${HSD_ROUTE_ROOT}/handoffs/reconciliation` },
  ],
} as const

export const HSD_DOSSIER_SECTIONS = [
  ['identity_positioning', 'Identité & positionnement', 'Définir la place exacte du service dans le portefeuille.'],
  ['doctrine_promise', 'Doctrine & promesse', 'Encadrer la mission, la valeur et les responsabilités non négociables.'],
  ['customer_profiles', 'Profils clients', 'Qualifier les décideurs, contextes d’achat et attentes.'],
  ['beneficiary_profiles', 'Profils bénéficiaires', 'Encadrer âge, autonomie, développement et besoins d’adaptation.'],
  ['usage_situations', 'Situations d’usage', 'Gouverner les situations réelles dans lesquelles le service est vendu.'],
  ['objectives_outcomes', 'Objectifs & résultats', 'Définir les résultats attendus et observables.'],
  ['capacity', 'Capacité & faisabilité', 'Définir les limites de durée, ratio, zones et préavis.'],
  ['mission_formats', 'Formats de mission', 'Définir mission unique, récurrence, programme et package.'],
  ['activities', 'Activités & blocs service', 'Définir les blocs composables et leurs contraintes.'],
  ['staffing', 'Personnel & compétences', 'Définir le profil requis sans attribuer l’agent.'],
  ['materials', 'Matériel & équipements', 'Définir ressources AngelCare et client.'],
  ['safety', 'Sécurité & safeguarding', 'Définir risques, consentements et règles d’arrêt.'],
  ['route_transport', 'Route & transport', 'Définir itinéraires, buffers, responsabilités et remboursements.'],
  ['quality_evidence', 'Qualité & preuves', 'Définir checklists, rapports, preuves et boucles de correction.'],
  ['pricing', 'Tarification & coûts', 'Définir bases tarifaires, coûts, marges et dates d’effet.'],
  ['features_upsells', 'Fonctions, top-ups & upsells', 'Définir options et extensions commercialisables.'],
  ['commercial_communication', 'Communication commerciale', 'Définir description, FAQ, objections et préparation client.'],
  ['performance', 'Performance & apprentissage', 'Mesurer qualité, conversion, réachat et amélioration continue.'],
] as const

export const HSD_IMPORT_TYPES = [
  'service_categories', 'doctrine_rules', 'capacity_rules', 'features', 'topups', 'upsells',
  'activities', 'competencies', 'risks', 'checklists', 'report_fields', 'pricing',
] as const

export const HSD_PERMISSIONS = [
  'homeservice_design.view',
  'homeservice_design.manage_categories',
  'homeservice_design.import_configuration',
  'homeservice_design.manage_doctrine',
  'homeservice_design.manage_capabilities',
  'homeservice_design.manage_activity_library',
  'homeservice_design.manage_staffing',
  'homeservice_design.manage_safety',
  'homeservice_design.manage_pricing',
  'homeservice_design.review',
  'homeservice_design.approve',
  'homeservice_design.publish',
  'homeservice_design.create_carelink_handoff',
  'homeservice_design.override_rules',
  'homeservice_design.audit',
  'homeservice_design.admin',
] as const

export function statusLabel(status: HsdStatus | string) {
  const labels: Record<string, string> = {
    draft: 'Brouillon', active: 'Actif', review: 'À revoir', approved: 'Approuvé', blocked: 'Bloqué',
    suspended: 'Suspendu', retired: 'Retiré', archived: 'Archivé',
  }
  return labels[status] || status
}

export function readinessBand(score: number) {
  if (score >= 85) return { label: 'Prêt', tone: 'emerald' as const }
  if (score >= 65) return { label: 'Conditionnel', tone: 'amber' as const }
  if (score > 0) return { label: 'Incomplet', tone: 'rose' as const }
  return { label: 'Non commencé', tone: 'slate' as const }
}
