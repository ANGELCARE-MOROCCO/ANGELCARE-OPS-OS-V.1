import {
  REVENUE_OS_CONTRACT_VERSION,
  REVENUE_OS_FEATURE_FLAGS,
  REVENUE_OS_MODULE_VERSION,
  REVENUE_OS_RELEASE_CODE,
  REVENUE_OS_WORKSPACES,
} from './constants'
import { getRevenueOsEnvironmentConfig } from './env'
import { createRevenueOsCode, createRevenueOsEventId } from './ids'
import type {
  RevenueOsAuditEvent,
  RevenueOsFoundationBootstrap,
  RevenueOsObjective,
  RevenueOsSystemCheck,
} from './types'

const now = new Date()
const nowIso = now.toISOString()

export const FOUNDATION_OBJECTIVES: RevenueOsObjective[] = [
  {
    id: 'foundation-objective-market-capture',
    code: 'REV-OBJ-FOUNDATION-001',
    title: 'Installer la capacité de pilotage stratégique Revenue OS',
    mandate: 'Verrouiller la fondation technique, la gouvernance, la navigation et la traçabilité nécessaires avant toute intelligence autonome.',
    businessUnit: 'Revenue Command OS',
    targetMarket: 'Fondation interne AngelCare',
    horizon: 'Phase 2 — Revenue Digital Twin actif',
    priority: 'critical',
    status: 'active',
    executionMode: 'shadow',
    owner: 'Direction Générale',
    createdAt: nowIso,
    updatedAt: nowIso,
    source: 'foundation-seed',
  },
  {
    id: 'foundation-objective-academy-pilot',
    code: 'REV-OBJ-PILOT-ACADEMY-001',
    title: 'Structurer le pilote Academy & B2B dans le Revenue Digital Twin',
    mandate: 'Modéliser les offres, segments, décideurs, parcours, capacités et dépendances du pilote Academy & B2B avant l’activation du Strategy Brain.',
    businessUnit: 'AngelCare Academy × B2B Partnerships',
    targetMarket: 'Crèches, maternelles et préscolaires — Maroc',
    horizon: 'Phase 2 — modèle commercial en validation',
    priority: 'high',
    status: 'draft',
    executionMode: 'shadow',
    owner: 'Direction Revenue',
    createdAt: nowIso,
    updatedAt: nowIso,
    source: 'foundation-seed',
  },
]

export const FOUNDATION_SYSTEM_CHECKS: RevenueOsSystemCheck[] = [
  {
    key: 'contract-lock',
    label: 'Contrat canonique Revenue OS',
    status: 'operational',
    detail: `${REVENUE_OS_CONTRACT_VERSION} verrouillé comme source de vérité fonctionnelle.`,
    checkedAt: nowIso,
  },
  {
    key: 'route-containment',
    label: 'Containment des routes',
    status: 'operational',
    detail: 'Le module est isolé sous /revenue-command-os et ne remplace aucune route historique.',
    checkedAt: nowIso,
  },
  {
    key: 'execution-safety',
    label: 'Sécurité d’exécution',
    status: 'operational',
    detail: 'Mode Shadow imposé. Les actions externes restent verrouillées.',
    checkedAt: nowIso,
  },
  {
    key: 'database-foundation',
    label: 'Persistance Supabase',
    status: 'attention',
    detail: 'Les migrations Phase 1 et Phase 2 doivent être appliquées dans chaque environnement pour activer la persistance complète du Digital Twin.',
    checkedAt: nowIso,
    action: 'Appliquer 20260720_revenue_command_os_phase2_digital_twin.sql après la migration Phase 1',
  },
  {
    key: 'digital-twin-model',
    label: 'Revenue Digital Twin',
    status: 'operational',
    detail: 'Le portefeuille commercial, les segments, décideurs, marchés, parcours, prix, capacités et dépendances sont structurés et validables.',
    checkedAt: nowIso,
  },
  {
    key: 'audit-foundation',
    label: 'Traçabilité & Event IDs',
    status: 'operational',
    detail: 'Contrat événementiel v1, identifiants globaux et journal d’audit initialisés.',
    checkedAt: nowIso,
  },
  {
    key: 'ai-provider-boundary',
    label: 'Frontière fournisseur IA',
    status: 'operational',
    detail: 'Gemini est isolé derrière le gateway provider-neutral; aucun accès direct aux secrets, à Supabase ou aux actions externes.',
    checkedAt: nowIso,
  },
]

export const FOUNDATION_AUDIT_EVENTS: RevenueOsAuditEvent[] = [
  {
    id: 'foundation-audit-contract-lock',
    eventId: createRevenueOsEventId('CONTRACT_LOCK', now),
    action: 'foundation.contract_locked',
    actor: 'Installation cumulative Phase 2',
    actorType: 'migration',
    resourceType: 'revenue_os_contract',
    resourceId: REVENUE_OS_CONTRACT_VERSION,
    outcome: 'success',
    summary: 'Le contrat canonique Revenue Command OS a été enregistré dans la fondation.',
    createdAt: nowIso,
    metadata: { releaseCode: REVENUE_OS_RELEASE_CODE },
  },
  {
    id: 'foundation-audit-module-ready',
    eventId: createRevenueOsEventId('MODULE_READY', new Date(now.getTime() - 1000)),
    action: 'foundation.module_ready',
    actor: 'Revenue OS Foundation',
    actorType: 'system',
    resourceType: 'module',
    resourceId: 'revenue-command-os',
    outcome: 'success',
    summary: 'Le shell, le Revenue Digital Twin, les workspaces, les flags et les dictionnaires sont disponibles.',
    createdAt: nowIso,
    metadata: { moduleVersion: REVENUE_OS_MODULE_VERSION },
  },
]

export function createFoundationBootstrap(
  overrides: Partial<RevenueOsFoundationBootstrap> = {},
): RevenueOsFoundationBootstrap {
  const env = getRevenueOsEnvironmentConfig()
  const auditEvents = overrides.auditEvents ?? FOUNDATION_AUDIT_EVENTS
  const objectives = overrides.objectives ?? FOUNDATION_OBJECTIVES
  const featureFlags = overrides.featureFlags ?? REVENUE_OS_FEATURE_FLAGS
  const systemChecks = overrides.systemChecks ?? FOUNDATION_SYSTEM_CHECKS
  const workspaces = overrides.workspaces ?? REVENUE_OS_WORKSPACES

  return {
    contractVersion: REVENUE_OS_CONTRACT_VERSION,
    releaseCode: REVENUE_OS_RELEASE_CODE,
    moduleVersion: REVENUE_OS_MODULE_VERSION,
    environment: env.environment,
    executionMode: env.executionMode,
    storageMode: 'foundation-fallback',
    generatedAt: new Date().toISOString(),
    workspaces,
    featureFlags,
    systemChecks,
    objectives,
    auditEvents,
    counters: {
      workspaceCount: workspaces.length,
      lockedContractItems: workspaces.reduce((total, item) => total + item.contractScope.length, 0),
      enabledFeatureFlags: featureFlags.filter((item) => item.enabled).length,
      pendingApprovals: 0,
      openExceptions: systemChecks.filter((item) => item.status === 'attention' || item.status === 'degraded').length,
      auditEventsToday: auditEvents.length,
    },
    ...overrides,
  }
}

export function createFoundationObjective(input: {
  title: string
  mandate: string
  businessUnit: string
  targetMarket: string
  horizon: string
  priority: RevenueOsObjective['priority']
  executionMode: RevenueOsObjective['executionMode']
  owner?: string
}): RevenueOsObjective {
  const timestamp = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    code: createRevenueOsCode('REV-OBJ'),
    title: input.title.trim(),
    mandate: input.mandate.trim(),
    businessUnit: input.businessUnit.trim(),
    targetMarket: input.targetMarket.trim(),
    horizon: input.horizon.trim(),
    priority: input.priority,
    status: 'submitted',
    executionMode: input.executionMode,
    owner: input.owner?.trim() || 'Direction Revenue',
    createdAt: timestamp,
    updatedAt: timestamp,
    source: 'manual',
  }
}
