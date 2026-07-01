import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360InternalAdminPayload = Record<string, unknown>

type InternalAdminWiringKey =
  | 'ac360.internal_admin.portfolio_account.upsert'
  | 'ac360.internal_admin.support_queue.upsert'
  | 'ac360.internal_admin.support_ticket.open'
  | 'ac360.internal_admin.support_ticket.status'
  | 'ac360.internal_admin.deployment_release.create'
  | 'ac360.internal_admin.deployment_check.record'
  | 'ac360.internal_admin.deployment_incident.open'
  | 'ac360.internal_admin.deployment_incident.resolve'
  | 'ac360.internal_admin.city_market.upsert'
  | 'ac360.internal_admin.expansion_campaign.create'
  | 'ac360.internal_admin.task.create'
  | 'ac360.internal_admin.reconcile'
  | 'ac360.internal_admin.alert.resolve'

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeInternalAdminRpc(
  wiringKey: InternalAdminWiringKey,
  body: Ac360InternalAdminPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.portfolioId || body.portfolio_id || body.ticketId || body.ticket_id || body.releaseId || body.release_id || body.incidentId || body.incident_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 internal admin RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.internal-admin',
      phase: 'phase_2r_internal_admin_nationwide_success',
      uiBuildAllowed: false,
      internalOnly: true,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked internal admin action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360InternalAdminDashboard(orgId?: string, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_internal_admin_dashboard', { p_org_id: resolved.orgId, p_as_of_date: asOfDate || null } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 internal admin dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360InternalPortfolioAccount(body: Ac360InternalAdminPayload) {
  const actorId = await currentActorId()
  return executeInternalAdminRpc('ac360.internal_admin.portfolio_account.upsert', body, 'ac360_internal_upsert_portfolio_account', {
    p_portfolio_id: body.portfolioId || body.portfolio_id || null,
    p_managed_org_id: body.managedOrgId || body.managed_org_id || null,
    p_portfolio_key: body.portfolioKey || body.portfolio_key || null,
    p_client_name: body.clientName || body.client_name || body.label || null,
    p_city: body.city || null,
    p_segment: text(body.segment, 'standard_school'),
    p_lifecycle_stage: text(body.lifecycleStage || body.lifecycle_stage, 'active'),
    p_success_tier: text(body.successTier || body.success_tier, 'standard'),
    p_health_status: text(body.healthStatus || body.health_status, 'unknown'),
    p_risk_level: text(body.riskLevel || body.risk_level, 'normal'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'portfolio_account.upsert' })
}

export async function upsertAc360InternalSupportQueue(body: Ac360InternalAdminPayload) {
  return executeInternalAdminRpc('ac360.internal_admin.support_queue.upsert', body, 'ac360_internal_upsert_support_queue', {
    p_queue_id: body.queueId || body.queue_id || null,
    p_queue_key: body.queueKey || body.queue_key || null,
    p_label: body.label || null,
    p_queue_type: text(body.queueType || body.queue_type, 'support'),
    p_sla_minutes: body.slaMinutes || body.sla_minutes || 1440,
    p_escalation_minutes: body.escalationMinutes || body.escalation_minutes || 2880,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'support_queue.upsert' })
}

export async function openAc360InternalSupportTicket(body: Ac360InternalAdminPayload) {
  const actorId = await currentActorId()
  return executeInternalAdminRpc('ac360.internal_admin.support_ticket.open', body, 'ac360_internal_open_support_ticket', {
    p_portfolio_account_id: body.portfolioAccountId || body.portfolio_account_id || null,
    p_managed_org_id: body.managedOrgId || body.managed_org_id || null,
    p_queue_id: body.queueId || body.queue_id || null,
    p_ticket_key: body.ticketKey || body.ticket_key || null,
    p_subject: body.subject || body.title || null,
    p_description: body.description || null,
    p_channel: text(body.channel, 'internal'),
    p_priority: text(body.priority, 'normal'),
    p_severity: text(body.severity, 'medium'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'support_ticket.open' })
}

export async function updateAc360InternalSupportTicketStatus(body: Ac360InternalAdminPayload) {
  const actorId = await currentActorId()
  return executeInternalAdminRpc('ac360.internal_admin.support_ticket.status', body, 'ac360_internal_update_support_ticket_status', {
    p_ticket_id: body.ticketId || body.ticket_id,
    p_status: text(body.status, 'in_progress'),
    p_actor_app_user_id: actorId,
    p_message: body.message || body.resolutionSummary || body.resolution_summary || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'support_ticket.status' })
}

export async function createAc360InternalDeploymentRelease(body: Ac360InternalAdminPayload) {
  const actorId = await currentActorId()
  return executeInternalAdminRpc('ac360.internal_admin.deployment_release.create', body, 'ac360_internal_create_deployment_release', {
    p_release_key: body.releaseKey || body.release_key || null,
    p_label: body.label || null,
    p_release_type: text(body.releaseType || body.release_type, 'runtime_patch'),
    p_target_environment: text(body.targetEnvironment || body.target_environment, 'production'),
    p_risk_level: text(body.riskLevel || body.risk_level, 'normal'),
    p_release_notes: body.releaseNotes || body.release_notes || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'deployment_release.create' })
}

export async function recordAc360InternalDeploymentCheck(body: Ac360InternalAdminPayload) {
  const actorId = await currentActorId()
  return executeInternalAdminRpc('ac360.internal_admin.deployment_check.record', body, 'ac360_internal_record_deployment_check', {
    p_deployment_release_id: body.deploymentReleaseId || body.deployment_release_id || body.releaseId || body.release_id || null,
    p_check_key: body.checkKey || body.check_key || null,
    p_label: body.label || null,
    p_check_group: text(body.checkGroup || body.check_group, 'deployment'),
    p_status: text(body.status, 'passed'),
    p_required: body.required ?? true,
    p_result_json: body.resultJson || body.result_json || body.result || {},
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'deployment_check.record' })
}

export async function openAc360InternalDeploymentIncident(body: Ac360InternalAdminPayload) {
  return executeInternalAdminRpc('ac360.internal_admin.deployment_incident.open', body, 'ac360_internal_open_deployment_incident', {
    p_deployment_release_id: body.deploymentReleaseId || body.deployment_release_id || body.releaseId || body.release_id || null,
    p_incident_key: body.incidentKey || body.incident_key || null,
    p_title: body.title || null,
    p_severity: text(body.severity, 'medium'),
    p_impact_scope: text(body.impactScope || body.impact_scope, 'single_client'),
    p_assigned_to: body.assignedTo || body.assigned_to || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'deployment_incident.open' })
}

export async function resolveAc360InternalDeploymentIncident(body: Ac360InternalAdminPayload) {
  return executeInternalAdminRpc('ac360.internal_admin.deployment_incident.resolve', body, 'ac360_internal_resolve_deployment_incident', {
    p_incident_id: body.incidentId || body.incident_id,
    p_resolution_summary: body.resolutionSummary || body.resolution_summary || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'deployment_incident.resolve' })
}

export async function upsertAc360InternalCityMarket(body: Ac360InternalAdminPayload) {
  return executeInternalAdminRpc('ac360.internal_admin.city_market.upsert', body, 'ac360_internal_upsert_city_market', {
    p_city_key: body.cityKey || body.city_key || null,
    p_city_name: body.cityName || body.city_name || body.city || null,
    p_region_name: body.regionName || body.region_name || null,
    p_market_status: text(body.marketStatus || body.market_status, 'planned'),
    p_target_schools: body.targetSchools || body.target_schools || 0,
    p_assigned_lead: body.assignedLead || body.assigned_lead || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'city_market.upsert' })
}

export async function createAc360InternalExpansionCampaign(body: Ac360InternalAdminPayload) {
  return executeInternalAdminRpc('ac360.internal_admin.expansion_campaign.create', body, 'ac360_internal_create_expansion_campaign', {
    p_city_market_id: body.cityMarketId || body.city_market_id || null,
    p_campaign_key: body.campaignKey || body.campaign_key || null,
    p_label: body.label || null,
    p_campaign_type: text(body.campaignType || body.campaign_type, 'city_launch'),
    p_target_accounts: body.targetAccounts || body.target_accounts || 0,
    p_starts_on: body.startsOn || body.starts_on || null,
    p_ends_on: body.endsOn || body.ends_on || null,
    p_assigned_owner: body.assignedOwner || body.assigned_owner || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'expansion_campaign.create' })
}

export async function createAc360InternalAdminTask(body: Ac360InternalAdminPayload) {
  const actorId = await currentActorId()
  return executeInternalAdminRpc('ac360.internal_admin.task.create', body, 'ac360_internal_create_admin_task', {
    p_portfolio_account_id: body.portfolioAccountId || body.portfolio_account_id || null,
    p_task_key: body.taskKey || body.task_key || null,
    p_title: body.title || null,
    p_task_type: text(body.taskType || body.task_type, 'internal_admin'),
    p_priority: text(body.priority, 'normal'),
    p_due_at: body.dueAt || body.due_at || null,
    p_assigned_to: body.assignedTo || body.assigned_to || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'task.create' })
}

export async function reconcileAc360InternalAdmin(body: Ac360InternalAdminPayload) {
  return executeInternalAdminRpc('ac360.internal_admin.reconcile', body, 'ac360_internal_admin_reconcile', {
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'reconcile' })
}

export async function resolveAc360InternalAdminAlert(body: Ac360InternalAdminPayload) {
  const actorId = await currentActorId()
  return executeInternalAdminRpc('ac360.internal_admin.alert.resolve', body, 'ac360_internal_resolve_admin_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_actor_app_user_id: actorId,
    p_resolution_note: body.resolutionNote || body.resolution_note || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { internalAdminAction: 'alert.resolve' })
}
