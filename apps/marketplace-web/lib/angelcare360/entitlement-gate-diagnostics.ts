import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'

export type Angelcare360CustomerGateClassification =
  | 'COMMERCIAL_NOT_INCLUDED'
  | 'CONFIGURATION_REQUIRED'
  | 'TENANT_NOT_RESOLVED'
  | 'TENANT_INACTIVE'
  | 'SUBSCRIPTION_MISSING'
  | 'SUBSCRIPTION_INACTIVE'
  | 'PACKAGE_NOT_RESOLVED'
  | 'SNAPSHOT_MISSING'
  | 'SNAPSHOT_INACTIVE'
  | 'ENTITLEMENT_KEY_UNKNOWN'
  | 'ENTITLEMENT_RESTRICTED'
  | 'RUNTIME_AUTHORITY_PARTIAL'
  | 'RUNTIME_AUTHORITY_UNAVAILABLE'
  | 'DEMO_CONTEXT_MISMATCH'

export type Angelcare360CustomerGatePresentation = {
  classification: Angelcare360CustomerGateClassification
  icon: 'settings' | 'clock' | 'gauge' | 'dependency' | 'suspended' | 'locked'
  title: string
  explanation: string
  action: { href: string; label: string }
}

const SETTINGS_PATH = '/angelcare-360-command-center/administration/parametres'
const DIRECTION_PATH = '/angelcare-360-command-center/direction'
const CONFIGURATION_STATES = new Set(['configuration_required', 'requires_configuration', 'unconfigured'])
const COMMERCIAL_STATES = new Set(['not_included', 'excluded'])
const PENDING_STATES = new Set(['pending', 'compiled', 'provisioning', 'provisioning_required', 'activation_pending'])
const CAPACITY_STATES = new Set(['capacity', 'capacity_reached', 'limit', 'limit_reached', 'quota', 'quota_reached'])
const DEPENDENCY_STATES = new Set(['dependency', 'dependency_unavailable', 'incompatible'])
const SUSPENDED_STATES = new Set(['suspended', 'locked', 'cancelled', 'expired', 'archived'])
const MIGRATION_STATES = new Set(['deprecated', 'migration', 'retired'])

function classify(runtime: Angelcare360RuntimeEntitlements, restrictionState?: string | null): Angelcare360CustomerGateClassification {
  const state = String(restrictionState || '').trim().toLowerCase()
  switch (runtime.diagnosticCode) {
    case 'TENANT_NOT_RESOLVED': return 'TENANT_NOT_RESOLVED'
    case 'TENANT_INACTIVE': return 'TENANT_INACTIVE'
    case 'SUBSCRIPTION_MISSING': return 'SUBSCRIPTION_MISSING'
    case 'SUBSCRIPTION_INACTIVE': return 'SUBSCRIPTION_INACTIVE'
    case 'PACKAGE_VERSION_MISSING':
    case 'PACKAGE_VERSION_INACTIVE': return 'PACKAGE_NOT_RESOLVED'
    case 'SNAPSHOT_MISSING': return 'SNAPSHOT_MISSING'
    case 'SNAPSHOT_INACTIVE': return 'SNAPSHOT_INACTIVE'
    case 'ENTITLEMENT_KEY_UNKNOWN': return 'ENTITLEMENT_KEY_UNKNOWN'
    case 'DEMO_CONTEXT_MISMATCH': return 'DEMO_CONTEXT_MISMATCH'
    case 'AUTHORITY_UNAVAILABLE': return runtime.state === 'partial' ? 'RUNTIME_AUTHORITY_PARTIAL' : 'RUNTIME_AUTHORITY_UNAVAILABLE'
    case 'CONTEXT_MISMATCH': return 'RUNTIME_AUTHORITY_UNAVAILABLE'
    case 'ENTITLEMENT_RESTRICTED': break
    default: break
  }

  if (CONFIGURATION_STATES.has(state)) return 'CONFIGURATION_REQUIRED'
  if (COMMERCIAL_STATES.has(state)) return 'COMMERCIAL_NOT_INCLUDED'
  if (runtime.state === 'legacy_unconfigured') return 'TENANT_NOT_RESOLVED'
  if (runtime.state === 'unavailable') return 'RUNTIME_AUTHORITY_UNAVAILABLE'
  if (runtime.state === 'partial' && !state) return 'RUNTIME_AUTHORITY_PARTIAL'
  return 'ENTITLEMENT_RESTRICTED'
}

export function getAngelcare360CustomerGatePresentation(
  runtime: Angelcare360RuntimeEntitlements,
  restrictionState?: string | null,
): Angelcare360CustomerGatePresentation {
  const state = String(restrictionState || '').trim().toLowerCase()
  const classification = classify(runtime, state)

  if (classification === 'CONFIGURATION_REQUIRED') return {
    classification, icon: 'settings', title: 'Configuration nécessaire',
    explanation: 'Ce service doit être configuré par une personne autorisée avant sa première utilisation.',
    action: { href: SETTINGS_PATH, label: 'Ouvrir la configuration' },
  }
  if (classification === 'COMMERCIAL_NOT_INCLUDED') return {
    classification, icon: 'locked', title: 'Non inclus dans votre offre',
    explanation: 'Ce service ne fait pas partie de l’offre actuellement active pour votre établissement.',
    action: { href: DIRECTION_PATH, label: 'Retour à l’accueil' },
  }
  if (classification === 'DEMO_CONTEXT_MISMATCH') return {
    classification, icon: 'locked', title: 'Session sécurisée non résolue',
    explanation: 'Cette session ne permet pas de résoudre l’établissement demandé. Reconnectez-vous pour rétablir votre accès.',
    action: { href: DIRECTION_PATH, label: 'Retour à l’accueil' },
  }
  if (classification === 'TENANT_INACTIVE' || classification === 'SUBSCRIPTION_INACTIVE' || SUSPENDED_STATES.has(state)) return {
    classification, icon: 'suspended', title: 'Service temporairement suspendu',
    explanation: 'L’accès de votre établissement est temporairement suspendu. Votre administrateur peut consulter la situation.',
    action: { href: DIRECTION_PATH, label: 'Consulter la situation' },
  }
  if (CAPACITY_STATES.has(state)) return {
    classification, icon: 'gauge', title: 'Limite de votre offre atteinte',
    explanation: 'La limite prévue dans votre offre est atteinte. La direction peut consulter les options disponibles.',
    action: { href: DIRECTION_PATH, label: 'Consulter la situation' },
  }
  if (DEPENDENCY_STATES.has(state) || classification === 'RUNTIME_AUTHORITY_UNAVAILABLE' || classification === 'RUNTIME_AUTHORITY_PARTIAL') return {
    classification, icon: 'dependency', title: 'Service temporairement indisponible',
    explanation: 'La vérification de cet accès est momentanément indisponible. Réessayez dans quelques instants.',
    action: { href: DIRECTION_PATH, label: 'Retour à l’accueil' },
  }
  if (MIGRATION_STATES.has(state)) return {
    classification, icon: 'clock', title: 'Service en cours d’évolution',
    explanation: 'Ce service évolue actuellement et ne peut pas être utilisé depuis cet écran.',
    action: { href: DIRECTION_PATH, label: 'Retour à l’accueil' },
  }
  if (PENDING_STATES.has(state) || ['TENANT_NOT_RESOLVED', 'SUBSCRIPTION_MISSING', 'PACKAGE_NOT_RESOLVED', 'SNAPSHOT_MISSING', 'SNAPSHOT_INACTIVE'].includes(classification)) return {
    classification, icon: 'clock', title: 'Activation nécessaire',
    explanation: 'L’activation de ce service n’est pas encore résolue. Votre administrateur peut consulter la situation.',
    action: { href: DIRECTION_PATH, label: 'Consulter la situation' },
  }

  return {
    classification, icon: 'locked', title: 'Accès non disponible',
    explanation: 'Ce droit d’accès n’a pas pu être confirmé pour votre établissement.',
    action: { href: DIRECTION_PATH, label: 'Retour à l’accueil' },
  }
}
