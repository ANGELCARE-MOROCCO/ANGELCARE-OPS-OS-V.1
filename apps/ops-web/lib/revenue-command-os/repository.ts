import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { REVENUE_OS_FEATURE_FLAGS, REVENUE_OS_WORKSPACES } from './constants'
import { getRevenueOsEnvironmentConfig } from './env'
import { normalizeRevenueOsError, RevenueOsError } from './errors'
import {
  createFoundationBootstrap,
  createFoundationObjective,
  FOUNDATION_AUDIT_EVENTS,
  FOUNDATION_OBJECTIVES,
  FOUNDATION_SYSTEM_CHECKS,
} from './foundation-data'
import { createRevenueOsEventId } from './ids'
import type {
  RevenueOsAuditEvent,
  RevenueOsFeatureFlag,
  RevenueOsFoundationBootstrap,
  RevenueOsObjective,
  RevenueOsObjectiveInput,
  RevenueOsSystemCheck,
  RevenueOsWorkspaceDefinition,
} from './types'

type Row = Record<string, any>

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
    icon: row.icon || fallback?.icon || 'Circle',
    order: Number(row.display_order ?? fallback?.order ?? 999),
    permission: row.permission_key || fallback?.permission || 'revenue_os.view',
    status: row.maturity_status || fallback?.status || 'planned',
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
    executionMode: row.execution_mode,
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

async function safeSelect<T>(query: PromiseLike<{ data: T[] | null; error: any }>, fallback: T[], warningLabel: string, warnings: string[]) {
  try {
    const { data, error } = await query
    if (error) {
      warnings.push(`${warningLabel}: ${error.message || 'lecture impossible'}`)
      return fallback
    }
    return data?.length ? data : fallback
  } catch (error) {
    warnings.push(`${warningLabel}: ${error instanceof Error ? error.message : String(error)}`)
    return fallback
  }
}

export async function readRevenueOsFoundation(): Promise<RepositoryReadResult> {
  const warnings: string[] = []
  let supabase: Awaited<ReturnType<typeof createClient>>

  try {
    supabase = await createClient()
  } catch (error) {
    warnings.push(`Supabase indisponible: ${error instanceof Error ? error.message : String(error)}`)
    return { bootstrap: createFoundationBootstrap(), warnings }
  }

  const [workspaceRows, flagRows, objectiveRows, auditRows, checkRows] = await Promise.all([
    safeSelect(
      supabase.from('revenue_os_workspaces').select('*').eq('active', true).order('display_order'),
      [],
      'Workspaces',
      warnings,
    ),
    safeSelect(
      supabase.from('revenue_os_feature_flags').select('*').order('flag_key'),
      [],
      'Feature flags',
      warnings,
    ),
    safeSelect(
      supabase.from('revenue_os_objectives').select('*').order('updated_at', { ascending: false }).limit(20),
      [],
      'Objectifs',
      warnings,
    ),
    safeSelect(
      supabase.from('revenue_os_audit_events').select('*').order('created_at', { ascending: false }).limit(30),
      [],
      'Audit',
      warnings,
    ),
    safeSelect(
      supabase.from('revenue_os_system_checks').select('*').order('check_key'),
      [],
      'Contrôles système',
      warnings,
    ),
  ])

  const workspaces = workspaceRows.length ? workspaceRows.map(rowToWorkspace) : REVENUE_OS_WORKSPACES
  const featureFlags = flagRows.length ? flagRows.map(rowToFeatureFlag) : REVENUE_OS_FEATURE_FLAGS
  const objectives = objectiveRows.length ? objectiveRows.map(rowToObjective) : FOUNDATION_OBJECTIVES
  const auditEvents = auditRows.length ? auditRows.map(rowToAudit) : FOUNDATION_AUDIT_EVENTS
  const systemChecks = checkRows.length ? checkRows.map(rowToCheck) : FOUNDATION_SYSTEM_CHECKS
  const storageMode = warnings.length >= 5 ? 'foundation-fallback' : 'supabase'

  return {
    bootstrap: createFoundationBootstrap({
      storageMode,
      workspaces,
      featureFlags,
      objectives,
      auditEvents,
      systemChecks,
      counters: {
        workspaceCount: workspaces.length,
        lockedContractItems: workspaces.reduce((total, item) => total + item.contractScope.length, 0),
        enabledFeatureFlags: featureFlags.filter((item) => item.enabled).length,
        pendingApprovals: 0,
        openExceptions: systemChecks.filter((item) => item.status === 'attention' || item.status === 'degraded').length,
        auditEventsToday: auditEvents.filter((item) => item.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
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
    const supabase = await createClient()
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
      metadata: { phase: 1, contract_locked: true },
    }
    const { data, error } = await supabase.from('revenue_os_objectives').insert(row).select('*').single()
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
    throw new RevenueOsError('REVENUE_OS_STORAGE_FAILURE', 'La création de l’objectif a échoué. Vérifiez les migrations cumulatives Revenue OS Phase 1 et Phase 2.', {
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
}, existingClient?: Awaited<ReturnType<typeof createClient>>) {
  try {
    const supabase = existingClient || await createClient()
    const eventId = createRevenueOsEventId(input.action.replace(/\./g, '_'))
    const { data, error } = await supabase.from('revenue_os_audit_events').insert({
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
