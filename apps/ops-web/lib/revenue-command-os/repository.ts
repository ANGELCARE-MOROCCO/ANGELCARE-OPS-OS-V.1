import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'
import { REVENUE_OS_CONTRACT_VERSION, REVENUE_OS_FEATURE_FLAGS, REVENUE_OS_MODULE_VERSION, REVENUE_OS_RELEASE_CODE, REVENUE_OS_WORKSPACES } from './constants'
import { getRevenueOsEnvironmentConfig } from './env'
import { normalizeRevenueOsError, RevenueOsError } from './errors'
import { createFoundationBootstrap, createFoundationObjective, FOUNDATION_SYSTEM_CHECKS } from './foundation-data'
import { createRevenueOsEventId } from './ids'
import { readRevenueOsOperationalModel } from './operational-read-model'
import type {
  RevenueOsAuditEvent,
  RevenueOsEnvironment,
  RevenueOsExecutionMode,
  RevenueOsFeatureFlag,
  RevenueOsFoundationBootstrap,
  RevenueOsObjective,
  RevenueOsObjectiveInput,
  RevenueOsSystemCheck,
  RevenueOsWorkspaceDefinition,
} from './types'

type Row = Record<string, any>
type DbClient = Awaited<ReturnType<typeof createServiceClient>>

type RepositoryReadResult = {
  bootstrap: RevenueOsFoundationBootstrap
  warnings: string[]
}

function rowToWorkspace(row: Row): RevenueOsWorkspaceDefinition {
  const fallback = REVENUE_OS_WORKSPACES.find((item) => item.key === row.workspace_key)
  return {
    key: row.workspace_key,
    label: row.label || fallback?.label || row.workspace_key,
    shortLabel: row.short_label || fallback?.shortLabel || row.label || row.workspace_key,
    description: row.description || fallback?.description || '',
    href: row.href || fallback?.href || `/revenue-command-os/${row.workspace_key}`,
    icon: row.icon || row.icon_name || fallback?.icon || 'Circle',
    order: Number(row.display_order ?? fallback?.order ?? 999),
    permission: row.permission_key || row.required_permission || fallback?.permission || 'revenue_os.view',
    status: row.maturity_status || row.status || fallback?.status || 'planned',
    accent: row.accent || fallback?.accent || 'navy',
    contractScope: Array.isArray(row.contract_scope) ? row.contract_scope : fallback?.contractScope || [],
  }
}

function rowToFeatureFlag(row: Row): RevenueOsFeatureFlag {
  const fallback = REVENUE_OS_FEATURE_FLAGS.find((item) => item.key === row.flag_key)
  return {
    key: row.flag_key,
    label: row.label || fallback?.label || row.flag_key,
    description: row.description || fallback?.description || '',
    enabled: Boolean(row.enabled),
    locked: Boolean(row.locked),
    environment: row.environment || fallback?.environment || 'all',
    riskClass: row.risk_class || fallback?.riskClass || 'controlled',
  }
}

function normalizeExecutionMode(value: unknown): RevenueOsExecutionMode {
  const mode = String(value || '').trim().toLowerCase()
  if (mode === 'recommend') return 'recommend'
  if (mode === 'limited-autonomy' || mode === 'limited_autonomy' || mode === 'limited_autopilot' || mode === 'limited-autopilot') return 'limited-autonomy'
  if (mode === 'approval-gated' || mode === 'approval_required' || mode === 'approval-required' || mode === 'approval_gated') return 'approval-gated'
  return mode === 'shadow' ? 'shadow' : 'approval-gated'
}

function normalizeEnvironment(value: unknown): RevenueOsEnvironment {
  const environment = String(value || '').trim().toLowerCase()
  return environment === 'production' ? 'production' : environment === 'staging' ? 'staging' : 'development'
}

function rowToObjective(row: Row): RevenueOsObjective {
  return {
    id: String(row.id),
    code: row.code,
    title: row.title,
    mandate: row.mandate,
    businessUnit: row.business_unit,
    targetMarket: row.target_market,
    horizon: row.horizon,
    priority: row.priority,
    status: row.status,
    executionMode: normalizeExecutionMode(row.execution_mode),
    owner: row.owner_label || row.owner_id || 'Direction Revenue',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: 'database',
  }
}

function rowToAudit(row: Row): RevenueOsAuditEvent {
  return {
    id: String(row.id),
    eventId: row.event_id,
    action: row.action,
    actor: row.actor_label || row.actor_id || 'Système',
    actorType: row.actor_type || 'system',
    resourceType: row.resource_type,
    resourceId: row.resource_id || undefined,
    outcome: row.outcome,
    summary: row.summary,
    createdAt: row.created_at,
    metadata: row.metadata || undefined,
  }
}

function rowToCheck(row: Row): RevenueOsSystemCheck {
  return {
    key: row.check_key,
    label: row.label,
    status: row.status,
    detail: row.detail,
    checkedAt: row.checked_at || row.updated_at || new Date().toISOString(),
    action: row.recommended_action || undefined,
  }
}

async function safeSelect<T>(
  query: PromiseLike<{ data: T[] | null; error: any }>,
  fallback: T[],
  warningLabel: string,
  warnings: string[],
): Promise<T[]> {
  try {
    const { data, error } = await query
    if (error) {
      warnings.push(`${warningLabel}: ${error.message || 'lecture impossible'}`)
      return fallback
    }
    return data || []
  } catch (error) {
    warnings.push(`${warningLabel}: ${error instanceof Error ? error.message : String(error)}`)
    return fallback
  }
}

async function safeSingle(
  query: PromiseLike<{ data: Row | null; error: any }>,
  warningLabel: string,
  warnings: string[],
): Promise<Row | null> {
  try {
    const { data, error } = await query
    if (error) {
      warnings.push(`${warningLabel}: ${error.message || 'lecture impossible'}`)
      return null
    }
    return data || null
  } catch (error) {
    warnings.push(`${warningLabel}: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

function mergeWorkspaces(rows: Row[]): RevenueOsWorkspaceDefinition[] {
  const database = rows.map(rowToWorkspace)
  const known = new Set(database.map((item) => item.key))
  return [...database, ...REVENUE_OS_WORKSPACES.filter((item) => !known.has(item.key))]
    .sort((left, right) => left.order - right.order)
}

function mergeFeatureFlags(rows: Row[]): RevenueOsFeatureFlag[] {
  const database = rows.map(rowToFeatureFlag)
  const known = new Set(database.map((item) => item.key))
  return [...database, ...REVENUE_OS_FEATURE_FLAGS.filter((item) => !known.has(item.key))]
    .sort((left, right) => left.key.localeCompare(right.key))
}

function runtimeChecks(input: {
  installation: Row | null
  executionMode: RevenueOsExecutionMode
  environment: RevenueOsEnvironment
  operationalWarnings: string[]
  operationalState: 'live' | 'partial' | 'unavailable'
}): RevenueOsSystemCheck[] {
  const checkedAt = new Date().toISOString()
  return [
    {
      key: 'runtime-identity',
      label: 'Identité du runtime Revenue OS',
      status: input.installation ? 'operational' : 'degraded',
      detail: input.installation
        ? `${input.installation.release_code || 'Release'} · ${input.installation.module_version || 'version non renseignée'} · environnement ${input.environment}.`
        : 'Le registre canonique revenue_os_installations est indisponible.',
      checkedAt,
      action: input.installation ? undefined : 'Vérifier la ligne installation_key=revenue-command-os.',
    },
    {
      key: 'execution-governance',
      label: 'Gouvernance d’exécution',
      status: input.executionMode === 'approval-gated' ? 'operational' : input.executionMode === 'shadow' ? 'attention' : 'operational',
      detail: input.executionMode === 'approval-gated'
        ? 'Actions internes actives; tout effet externe exige un canal autorisé, une approbation valide et une trace d’audit.'
        : `Mode ${input.executionMode} actif.`,
      checkedAt,
    },
    {
      key: 'operational-read-model',
      label: 'Sources Strategy · Programmes · Missions',
      status: input.operationalState === 'live' ? 'operational' : input.operationalState === 'partial' ? 'attention' : 'degraded',
      detail: input.operationalState === 'live'
        ? 'Les sources persistées sont lisibles et aucune donnée contractuelle n’est substituée aux résultats live.'
        : input.operationalWarnings.length ? input.operationalWarnings.slice(0, 3).join(' · ') : 'Source opérationnelle indisponible.',
      checkedAt,
      action: input.operationalState === 'live' ? undefined : 'Consulter les diagnostics de source avant toute publication.',
    },
  ]
}

export async function readRevenueOsFoundation(tenantId = 'angelcare-main'): Promise<RepositoryReadResult> {
  const warnings: string[] = []
  let supabase: DbClient

  try {
    supabase = await createServiceClient()
  } catch (error) {
    warnings.push(`Supabase indisponible: ${error instanceof Error ? error.message : String(error)}`)
    return { bootstrap: createFoundationBootstrap(), warnings }
  }

  const [installation, workspaceRows, flagRows, objectiveRows, auditRows, checkRows, operations] = await Promise.all([
    safeSingle(
      (supabase as any).from('revenue_os_installations').select('*').eq('installation_key', 'revenue-command-os').maybeSingle(),
      'Installation Revenue OS',
      warnings,
    ),
    safeSelect((supabase as any).from('revenue_os_workspaces').select('*').eq('active', true).order('display_order'), [], 'Workspaces', warnings),
    safeSelect((supabase as any).from('revenue_os_feature_flags').select('*').order('flag_key'), [], 'Feature flags', warnings),
    safeSelect((supabase as any).from('revenue_os_objectives').select('*').order('updated_at', { ascending: false }).limit(20), [], 'Objectifs', warnings),
    safeSelect((supabase as any).from('revenue_os_audit_events').select('*').order('created_at', { ascending: false }).limit(30), [], 'Audit', warnings),
    safeSelect((supabase as any).from('revenue_os_system_checks').select('*').order('check_key'), [], 'Contrôles système', warnings),
    readRevenueOsOperationalModel(tenantId, supabase),
  ])

  warnings.push(...operations.warnings.map((warning) => `Source opérationnelle: ${warning}`))

  const workspaces = mergeWorkspaces(workspaceRows as Row[])
  const featureFlags = mergeFeatureFlags(flagRows as Row[])
  const objectives = (objectiveRows as Row[]).map(rowToObjective)
  const auditEvents = (auditRows as Row[]).map(rowToAudit)
  const env = getRevenueOsEnvironmentConfig()
  const environment = normalizeEnvironment(installation?.environment || env.environment)
  const executionMode = normalizeExecutionMode(installation?.execution_mode || env.executionMode)
  const systemChecks = (checkRows as Row[]).length
    ? (checkRows as Row[]).map(rowToCheck)
    : runtimeChecks({ installation, executionMode, environment, operationalWarnings: operations.warnings, operationalState: operations.sourceState })
  const coreAvailable = Boolean(installation) && !(warnings.some((warning) => warning.startsWith('Workspaces:')))
  const storageMode: RevenueOsFoundationBootstrap['storageMode'] = coreAvailable ? 'supabase' : 'foundation-fallback'

  return {
    bootstrap: createFoundationBootstrap({
      contractVersion: installation?.contract_version || REVENUE_OS_CONTRACT_VERSION,
      releaseCode: installation?.release_code || REVENUE_OS_RELEASE_CODE,
      moduleVersion: installation?.module_version || REVENUE_OS_MODULE_VERSION,
      environment,
      executionMode,
      storageMode,
      workspaces,
      featureFlags,
      objectives,
      auditEvents,
      systemChecks,
      operations,
      counters: {
        workspaceCount: workspaces.length,
        lockedContractItems: workspaces.reduce((total, item) => total + item.contractScope.length, 0),
        enabledFeatureFlags: featureFlags.filter((item) => item.enabled).length,
        pendingApprovals: operations.counts.pendingApprovals,
        openExceptions: systemChecks.filter((item) => item.status === 'attention' || item.status === 'degraded').length + operations.counts.openContradictions + operations.counts.blockedTasks,
        auditEventsToday: auditEvents.filter((item) => item.createdAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
      },
    }),
    warnings,
  }
}

export async function createRevenueOsObjective(input: RevenueOsObjectiveInput, actor?: { id?: string; label?: string }) {
  const env = getRevenueOsEnvironmentConfig()
  if (!env.enabled) {
    throw new RevenueOsError('REVENUE_OS_FEATURE_DISABLED', 'Revenue Command OS est désactivé.', { status: 409 })
  }

  const objective = createFoundationObjective({ ...input, owner: actor?.label })

  try {
    const supabase = await createServiceClient()
    const row = {
      id: objective.id,
      code: objective.code,
      title: objective.title,
      mandate: objective.mandate,
      business_unit: objective.businessUnit,
      target_market: objective.targetMarket,
      horizon: objective.horizon,
      priority: objective.priority,
      status: objective.status,
      execution_mode: objective.executionMode,
      owner_id: actor?.id || null,
      owner_label: actor?.label || objective.owner,
      source: 'manual',
      metadata: { phase: 16, contract_locked: true },
    }
    const { data, error } = await (supabase as any).from('revenue_os_objectives').insert(row).select('*').single()
    if (error) throw error

    await writeRevenueOsAuditEvent({
      action: 'objective.created',
      actorId: actor?.id,
      actorLabel: actor?.label || 'Utilisateur Revenue OS',
      actorType: 'user',
      resourceType: 'revenue_os_objective',
      resourceId: objective.id,
      outcome: 'success',
      summary: `Objectif stratégique créé: ${objective.title}`,
      metadata: { code: objective.code, executionMode: objective.executionMode },
    }, supabase)

    return rowToObjective(data)
  } catch (error) {
    throw new RevenueOsError('REVENUE_OS_STORAGE_FAILURE', 'La création de l’objectif a échoué. Consultez le diagnostic Supabase de la table revenue_os_objectives.', {
      status: 503,
      recoverable: true,
      cause: normalizeRevenueOsError(error),
    })
  }
}

export async function writeRevenueOsAuditEvent(input: {
  action: string
  actorId?: string
  actorLabel: string
  actorType: RevenueOsAuditEvent['actorType']
  resourceType: string
  resourceId?: string
  outcome: RevenueOsAuditEvent['outcome']
  summary: string
  metadata?: Record<string, unknown>
}, existingClient?: DbClient) {
  try {
    const supabase = existingClient || await createServiceClient()
    const eventId = createRevenueOsEventId(input.action.replace(/\./g, '_'))
    const { data, error } = await (supabase as any).from('revenue_os_audit_events').insert({
      event_id: eventId,
      action: input.action,
      actor_id: input.actorId || null,
      actor_label: input.actorLabel,
      actor_type: input.actorType,
      resource_type: input.resourceType,
      resource_id: input.resourceId || null,
      outcome: input.outcome,
      summary: input.summary,
      metadata: input.metadata || {},
    }).select('*').single()
    if (error) throw error
    return rowToAudit(data)
  } catch (error) {
    throw new RevenueOsError('REVENUE_OS_STORAGE_FAILURE', 'Impossible d’écrire le journal d’audit Revenue OS.', {
      status: 503,
      recoverable: true,
      cause: error,
    })
  }
}
