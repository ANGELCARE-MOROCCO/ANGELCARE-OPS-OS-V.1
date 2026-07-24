import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'
import type {
  RevenueOsChannelPolicy,
  RevenueOsOperationalMission,
  RevenueOsOperationalProgram,
  RevenueOsOperationalReadModel,
  RevenueOsOperationalStrategy,
} from './types'

type Row = Record<string, any>
type DbClient = Awaited<ReturnType<typeof createServiceClient>>

const text = (value: unknown, fallback = '') => {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}
const number = (value: unknown, fallback = 0) => {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : fallback
}
const bool = (value: unknown, fallback = false) => value == null ? fallback : Boolean(value)
const payloadOf = (row: Row | undefined | null): Row => {
  if (!row) return {}
  return row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload) ? row.payload : row
}
const stringArray = (value: unknown): string[] => Array.isArray(value)
  ? value.map((item) => text(typeof item === 'object' && item ? (item as Row).label || (item as Row).name || (item as Row).id : item)).filter(Boolean)
  : value ? [text(value)].filter(Boolean) : []
const objectArray = (value: unknown): Row[] => Array.isArray(value)
  ? value.filter((item): item is Row => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
  : []
const iso = (value: unknown) => {
  const date = value ? new Date(String(value)) : new Date(0)
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString()
}
const latest = (...values: unknown[]) => values.map(iso).sort().at(-1) || new Date(0).toISOString()
const clamp = (value: unknown) => Math.max(0, Math.min(100, Math.round(number(value))))
const normalizedStatus = (value: unknown, fallback = 'unknown') => text(value, fallback).toLowerCase().replace(/[\s-]+/g, '_')

async function readRows(
  client: DbClient,
  table: string,
  tenantId: string | null,
  warnings: string[],
  limit = 500,
): Promise<Row[]> {
  try {
    let query: any = (client as any).from(table).select('*')
    if (tenantId) query = query.eq('tenant_id', tenantId)
    query = query.order('updated_at', { ascending: false }).limit(limit)
    let response = await query
    if (response.error && String(response.error.message || '').toLowerCase().includes('updated_at')) {
      query = (client as any).from(table).select('*')
      if (tenantId) query = query.eq('tenant_id', tenantId)
      response = await query.limit(limit)
    }
    if (response.error) throw response.error
    return response.data || []
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    warnings.push(`${table}: ${message}`)
    return []
  }
}

function strategyRows(
  rows: Row[],
  classifications: Row[],
  approvals: Row[],
  contradictions: Row[],
): RevenueOsOperationalStrategy[] {
  return rows.map((row) => {
    const payload = payloadOf(row)
    const id = text(row.id, text(payload.id))
    const classificationRow = classifications.find((item) => text(item.strategy_id, text(payloadOf(item).strategyId)) === id)
    const approvalRow = approvals.find((item) => text(item.strategy_id, text(payloadOf(item).strategyId)) === id)
    const risks = objectArray(payload.risks)
    const assumptions = objectArray(payload.assumptions)
    const evidence = objectArray(payload.trustEvidence).length + stringArray(payload.evidence).length
    const strategyContradictions = contradictions.filter((item) => text(item.strategy_id, text(payloadOf(item).strategyId)) === id && !['resolved', 'closed'].includes(normalizedStatus(item.status || payloadOf(item).status)))
    return {
      id,
      code: text(payload.code, text(row.code, `STR-${id.slice(0, 8).toUpperCase()}`)),
      title: text(payload.title, text(payload.objective, text(payload.thesis, 'Stratégie Revenue'))),
      thesis: text(payload.thesis, text(payload.valueProposition, 'Thèse non renseignée.')),
      archetype: text(payload.archetype, 'non_classé'),
      status: text(row.status, text(payload.status, 'draft')),
      version: text(row.version, text(payload.version, '1.0.0')),
      confidence: clamp(payload.confidence ?? payload.confidenceScore),
      evidenceCount: evidence,
      openAssumptions: assumptions.filter((item) => !['supported', 'validated', 'confirmed', 'resolved'].includes(normalizedStatus(item.status))).length,
      highRisks: risks.filter((item) => ['critical', 'high'].includes(normalizedStatus(item.severity || item.impact))).length,
      contradictions: strategyContradictions.length,
      councilClassification: classificationRow ? text(classificationRow.classification, text(payloadOf(classificationRow).classification)) : undefined,
      approvalStatus: approvalRow ? text(approvalRow.status, text(payloadOf(approvalRow).status)) : undefined,
      targetSegments: stringArray(payload.targetSegments),
      territories: stringArray(payload.territories || payload.targetMarket),
      updatedAt: latest(row.updated_at, row.created_at, payload.updatedAt, payload.createdAt),
    }
  }).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

function programRows(rows: Row[], campaigns: Row[], waves: Row[], missions: Row[], tasks: Row[]): RevenueOsOperationalProgram[] {
  return rows.map((row) => {
    const payload = payloadOf(row)
    const id = text(row.id, text(payload.id))
    const relatedCampaigns = campaigns.filter((item) => text(item.program_id, text(payloadOf(item).programId)) === id)
    const campaignIds = new Set(relatedCampaigns.map((item) => text(item.id, text(payloadOf(item).id))))
    const relatedWaves = waves.filter((item) => campaignIds.has(text(item.campaign_id, text(payloadOf(item).campaignId))))
    const relatedMissions = missions.filter((item) => text(item.program_id, text(payloadOf(item).programId)) === id)
    const missionIds = new Set(relatedMissions.map((item) => text(item.id, text(payloadOf(item).id))))
    const relatedTasks = tasks.filter((item) => missionIds.has(text(item.mission_id, text(payloadOf(item).missionId))))
    const completed = relatedTasks.filter((item) => ['completed', 'done', 'succeeded'].includes(normalizedStatus(payloadOf(item).taskStatus || item.status))).length
    const blocked = relatedTasks.filter((item) => ['blocked', 'failed', 'dead_letter'].includes(normalizedStatus(payloadOf(item).taskStatus || item.status))).length
    const status = text(row.status, text(payload.status, 'compiled'))
    const progress = relatedTasks.length
      ? Math.round((completed / relatedTasks.length) * 100)
      : ['completed', 'succeeded'].includes(normalizedStatus(status)) ? 100
        : ['active', 'in_progress', 'executing'].includes(normalizedStatus(status)) ? 55
          : ['compiled', 'ready'].includes(normalizedStatus(status)) ? 25 : 0
    return {
      id,
      code: text(payload.code, text(row.code, `PROGRAM-${id.slice(0, 8).toUpperCase()}`)),
      title: text(payload.title, text(row.title, 'Programme Revenue')),
      objective: text(payload.objective, text(payload.purpose, 'Objectif non renseigné.')),
      status,
      strategyId: text(row.strategy_id, text(payload.strategyId)),
      owner: text(payload.programOwnerRole, text(row.program_owner_role, 'Direction Revenue')),
      startDate: text(payload.startDate, text(row.start_date)) || undefined,
      endDate: text(payload.endDate, text(row.end_date)) || undefined,
      territories: stringArray(payload.territories || row.territories),
      campaigns: relatedCampaigns.length,
      waves: relatedWaves.length,
      missions: relatedMissions.length,
      tasksOpen: relatedTasks.filter((item) => !['completed', 'done', 'cancelled', 'rolled_back'].includes(normalizedStatus(payloadOf(item).taskStatus || item.status))).length,
      tasksBlocked: blocked,
      progress,
      risks: stringArray(payload.risks),
      updatedAt: latest(row.updated_at, row.created_at, payload.updatedAt, payload.createdAt),
    }
  }).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

function missionRows(rows: Row[], tasks: Row[], evidence: Row[]): RevenueOsOperationalMission[] {
  return rows.map((row) => {
    const payload = payloadOf(row)
    const id = text(row.id, text(payload.id))
    const relatedTasks = tasks.filter((item) => text(item.mission_id, text(payloadOf(item).missionId)) === id)
    const relatedEvidence = evidence.filter((item) => text(item.object_id, text(payloadOf(item).objectId)) === id || text(item.mission_id, text(payloadOf(item).missionId)) === id)
    const completed = relatedTasks.filter((item) => ['completed', 'done', 'succeeded'].includes(normalizedStatus(payloadOf(item).taskStatus || item.status))).length
    const blocked = relatedTasks.filter((item) => ['blocked', 'failed', 'dead_letter'].includes(normalizedStatus(payloadOf(item).taskStatus || item.status))).length
    return {
      id,
      code: text(payload.code, text(row.code, `MISSION-${id.slice(0, 8).toUpperCase()}`)),
      title: text(payload.title, text(row.title, 'Mission compilée')),
      purpose: text(payload.purpose, text(payload.businessImpact, 'Finalité non renseignée.')),
      status: text(row.status, text(payload.status, 'compiled')),
      priority: text(payload.priority, text(row.priority, 'normal')),
      strategyId: text(row.strategy_id, text(payload.strategyId)),
      programId: text(row.program_id, text(payload.programId)),
      campaignId: text(row.campaign_id, text(payload.campaignId)),
      owner: text(payload.ownerId, text(payload.ownerRole, text(row.owner_id, 'Non assignée'))),
      assignmentStatus: text(payload.assignmentStatus, text(row.assignment_status, 'unassigned')),
      startDate: text(payload.startDate, text(row.start_date)) || undefined,
      deadline: text(payload.deadline, text(row.deadline)) || undefined,
      taskCount: relatedTasks.length,
      completedTasks: completed,
      blockedTasks: blocked,
      evidenceCount: relatedEvidence.length || stringArray(payload.evidenceRequirementIds).length,
      nextAction: text(payload.nextAction, text(row.next_action)) || undefined,
      updatedAt: latest(row.updated_at, row.created_at, payload.updatedAt, payload.createdAt),
    }
  }).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function normalizeRevenueOsChannelPolicies(configRows: Row[] = [], registryRows: Row[] = [], globalExternalActionsEnabled = false): RevenueOsChannelPolicy[] {
  const definitions: Array<Pick<RevenueOsChannelPolicy, 'code' | 'label' | 'userControllable'> & { defaultEnabled: boolean; hardDisabled?: boolean }> = [
    { code: 'email_os', label: 'Email OS · mailboxes assignées', userControllable: false, defaultEnabled: true },
    { code: 'gmail', label: 'Gmail direct', userControllable: false, defaultEnabled: false, hardDisabled: true },
    { code: 'whatsapp', label: 'WhatsApp', userControllable: true, defaultEnabled: false },
    { code: 'calendar', label: 'Calendrier externe', userControllable: false, defaultEnabled: false, hardDisabled: true },
  ]
  return definitions.map((definition) => {
    const config = configRows.find((row) => text(row.adapter_code, text(row.code)) === definition.code)
    const registry = registryRows.find((row) => text(row.adapter_code, text(row.code)) === definition.code)
    const configured = definition.code === 'email_os' ? true : Boolean(config) || normalizedStatus(registry?.status) === 'configured'
    const requestedEnabled = config ? bool(config.enabled) : definition.defaultEnabled
    const enabled = definition.hardDisabled ? false : requestedEnabled
    const approvalRequired = definition.code !== 'calendar' && definition.code !== 'gmail'
    const policyState: RevenueOsChannelPolicy['policyState'] = definition.hardDisabled
      ? 'disabled'
      : definition.code === 'email_os' && enabled ? 'active'
        : definition.code === 'whatsapp' && enabled && (!configured || !globalExternalActionsEnabled) ? 'blocked'
          : enabled && configured ? 'active'
            : enabled ? 'blocked'
              : definition.userControllable ? 'available' : 'disabled'
    const reason = definition.code === 'email_os'
      ? enabled ? 'Canal officiel Revenue OS. Envoi limité aux mailboxes Email OS assignées et déverrouillées.' : 'Email OS doit rester actif pour l’exécution email Revenue OS.'
      : definition.code === 'gmail'
        ? 'Désactivé par doctrine: Revenue OS n’envoie pas directement via Gmail.'
        : definition.code === 'calendar'
          ? 'Désactivé par politique AngelCare.'
          : enabled && globalExternalActionsEnabled ? 'Activé manuellement; permissions, credentials et approbations restent obligatoires.' : enabled ? 'Configuration WhatsApp activée, mais le gate global des effets externes reste fermé.' : 'Disponible à l’activation manuelle par un utilisateur autorisé.'
    return { ...definition, enabled, configured, approvalRequired, policyState, reason }
  })
}

export async function readRevenueOsOperationalModel(
  tenantId: string,
  existingClient?: DbClient,
): Promise<RevenueOsOperationalReadModel> {
  const warnings: string[] = []
  let client: DbClient
  try {
    client = existingClient || await createServiceClient()
  } catch (error) {
    return {
      tenantId,
      sourceState: 'unavailable',
      generatedAt: new Date().toISOString(),
      warnings: [error instanceof Error ? error.message : String(error)],
      strategies: [], programs: [], missions: [],
      channels: normalizeRevenueOsChannelPolicies(),
      counts: { strategies: 0, strategiesReadyForCouncil: 0, strategiesApproved: 0, pendingApprovals: 0, openContradictions: 0, programs: 0, activePrograms: 0, missions: 0, openMissions: 0, blockedTasks: 0 },
    }
  }

  const [strategiesRaw, classifications, approvals, contradictions, programsRaw, campaigns, waves, missionsRaw, tasks, evidence, adapterConfigs, adapterRegistry, installationRows] = await Promise.all([
    readRows(client, 'revenue_os_strategies', tenantId, warnings, 120),
    readRows(client, 'revenue_os_council_classifications', tenantId, warnings, 120),
    readRows(client, 'revenue_os_approval_requests', tenantId, warnings, 200),
    readRows(client, 'revenue_os_council_contradictions', tenantId, warnings, 200),
    readRows(client, 'revenue_os_programs', tenantId, warnings, 150),
    readRows(client, 'revenue_os_campaigns', tenantId, warnings, 300),
    readRows(client, 'revenue_os_campaign_waves', tenantId, warnings, 500),
    readRows(client, 'revenue_os_missions', tenantId, warnings, 500),
    readRows(client, 'revenue_os_mission_tasks', tenantId, warnings, 1000),
    readRows(client, 'revenue_os_evidence_requirements', tenantId, warnings, 1000),
    readRows(client, 'revenue_os_adapter_configs', tenantId, warnings, 100),
    readRows(client, 'revenue_os_adapter_registry', null, warnings, 100),
    readRows(client, 'revenue_os_installations', null, warnings, 10),
  ])

  const strategies = strategyRows(strategiesRaw, classifications, approvals, contradictions)
  const programs = programRows(programsRaw, campaigns, waves, missionsRaw, tasks)
  const missions = missionRows(missionsRaw, tasks, evidence)
  const pendingApprovals = approvals.filter((row) => ['pending', 'requested', 'awaiting', 'awaiting_approval', 'awaiting_executive_review', 'under_review'].includes(normalizedStatus(row.status || payloadOf(row).status))).length
  const openContradictions = contradictions.filter((row) => !['resolved', 'closed'].includes(normalizedStatus(row.status || payloadOf(row).status))).length
  const sourceState: RevenueOsOperationalReadModel['sourceState'] = warnings.length === 0 ? 'live' : warnings.length < 5 ? 'partial' : 'unavailable'

  return {
    tenantId,
    sourceState,
    generatedAt: new Date().toISOString(),
    warnings,
    strategies,
    programs,
    missions,
    channels: normalizeRevenueOsChannelPolicies(adapterConfigs, adapterRegistry, Boolean(installationRows.find((row) => text(row.installation_key) === 'revenue-command-os')?.external_actions_enabled)),
    counts: {
      strategies: strategies.length,
      strategiesReadyForCouncil: strategies.filter((item) => ['ready_for_council', 'ready_for_comparison', 'candidate'].includes(normalizedStatus(item.status))).length,
      strategiesApproved: strategies.filter((item) => ['approved', 'ready_for_mz13', 'ready_for_compilation'].includes(normalizedStatus(item.status)) || ['approved', 'conditional_approval', 'ready_for_mz13'].includes(normalizedStatus(item.approvalStatus))).length,
      pendingApprovals,
      openContradictions,
      programs: programs.length,
      activePrograms: programs.filter((item) => ['active', 'compiled', 'ready', 'in_progress'].includes(normalizedStatus(item.status))).length,
      missions: missions.length,
      openMissions: missions.filter((item) => !['completed', 'cancelled', 'rolled_back', 'superseded'].includes(normalizedStatus(item.status))).length,
      blockedTasks: missions.reduce((total, item) => total + item.blockedTasks, 0),
    },
  }
}
