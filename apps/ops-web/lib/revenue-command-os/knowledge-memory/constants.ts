import type { RevenueKnowledgeSectionDefinition } from '../types'

export const REVENUE_KNOWLEDGE_RELEASE_CODE = 'AC-REVENUE-OS-MZ03-DOCTRINE-MEMORY'
export const REVENUE_KNOWLEDGE_MODULE_VERSION = '3.0.0-phase3'
export const REVENUE_KNOWLEDGE_MODEL_VERSION = 'AC-REVENUE-KNOWLEDGE-2026.07-V1'

export const REVENUE_KNOWLEDGE_SECTIONS: RevenueKnowledgeSectionDefinition[] = [
  { key: 'overview', label: 'Vue d’ensemble', description: 'Lecture exécutive de la vérité institutionnelle, de son niveau d’approbation, de sa fraîcheur et des risques de contradiction.', href: '/revenue-command-os/memory-learning', icon: 'BrainCircuit', status: 'ready' },
  { key: 'doctrine-library', label: 'Bibliothèque doctrinale', description: 'Doctrines commerciales, politiques, définitions de services et positionnements gouvernés par version et autorité.', href: '/revenue-command-os/memory-learning/doctrine-library', icon: 'LibraryBig', status: 'ready' },
  { key: 'knowledge-assets', label: 'Actifs & preuves', description: 'Catalogues, offres, politiques, scripts et documents de preuve reliés aux doctrines et prêts pour indexation contrôlée.', href: '/revenue-command-os/memory-learning/knowledge-assets', icon: 'Files', status: 'ready' },
  { key: 'rules-restrictions', label: 'Règles & restrictions', description: 'Garde-fous de prix, remise, promesse, marque, confidentialité, capacité et autorité.', href: '/revenue-command-os/memory-learning/rules-restrictions', icon: 'ShieldBan', status: 'ready' },
  { key: 'scripts-objections', label: 'Scripts & objections', description: 'Bibliothèque de scripts multicanaux et logique de diagnostic des objections sans promesse non autorisée.', href: '/revenue-command-os/memory-learning/scripts-objections', icon: 'MessagesSquare', status: 'ready' },
  { key: 'cases-patterns', label: 'Cas & patterns', description: 'Cas de succès, échecs, récupérations et patterns de campagnes réutilisables avec preuves et leçons.', href: '/revenue-command-os/memory-learning/cases-patterns', icon: 'BookOpenCheck', status: 'ready' },
  { key: 'playbooks-sops', label: 'Playbooks & SOP', description: 'Processus commerciaux exécutables, étapes, SLA, preuves, approbations et routes de récupération.', href: '/revenue-command-os/memory-learning/playbooks-sops', icon: 'Workflow', status: 'ready' },
  { key: 'approval-desk', label: 'Bureau d’approbation', description: 'Soumission, revue, amendement, approbation et activation des ressources institutionnelles.', href: '/revenue-command-os/memory-learning/approval-desk', icon: 'BadgeCheck', status: 'needs-attention' },
  { key: 'conflict-resolver', label: 'Résolution de conflits', description: 'Conflits de versions, règles, prix, autorité, marque, droit et sources avec résolution traçable.', href: '/revenue-command-os/memory-learning/conflict-resolver', icon: 'GitCompareArrows', status: 'needs-attention' },
  { key: 'versions-provenance', label: 'Versions & provenance', description: 'Chaîne de confiance, source d’autorité, historique, supersession et empreinte de chaque ressource.', href: '/revenue-command-os/memory-learning/versions-provenance', icon: 'History', status: 'ready' },
  { key: 'indexing-readiness', label: 'Préparation à l’indexation', description: 'Découpage documentaire, files d’indexation, contrôles de confidentialité et statut de recherche sémantique future.', href: '/revenue-command-os/memory-learning/indexing-readiness', icon: 'ScanSearch', status: 'needs-attention' },
  { key: 'model-validation', label: 'Validation du modèle', description: 'Contrôle de complétude, autorité, versioning, conflits, provenance, indexation et fraîcheur.', href: '/revenue-command-os/memory-learning/model-validation', icon: 'ShieldCheck', status: 'needs-attention' },
]

export const REVENUE_KNOWLEDGE_STATUS_ORDER = [
  'draft', 'in-review', 'approved', 'effective', 'suspended', 'retired', 'rejected',
] as const

export const REVENUE_KNOWLEDGE_TYPE_LABELS: Record<string, string> = {
  'commercial-doctrine': 'Doctrine commerciale', policy: 'Politique', playbook: 'Playbook', sop: 'SOP',
  'sales-script': 'Script commercial', 'objection-logic': 'Logique objection', 'case-study': 'Étude de cas',
  'campaign-pattern': 'Pattern campagne', 'offer-evidence': 'Preuve d’offre', 'pricing-rule': 'Règle de prix',
  'legal-restriction': 'Restriction légale', 'brand-standard': 'Standard de marque', 'partner-benefit': 'Avantage partenaire',
  'customer-profile': 'Profil client', 'market-positioning': 'Positionnement marché', 'service-definition': 'Définition de service',
}

export const REVENUE_KNOWLEDGE_MUTATION_ALLOWLIST = new Set([
  'title', 'summary', 'ownerRole', 'department', 'businessUnitCodes', 'confidentiality', 'reviewCycleDays',
  'effectiveFrom', 'effectiveTo', 'nextReviewAt', 'supersedesCode', 'applicableCommandFamilies',
  'applicableSegmentCodes', 'applicableOfferCodes', 'tags', 'sourceAuthority', 'contentBlocks', 'rules', 'evidenceRefs',
])
