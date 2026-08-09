import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"

import { requireRevenueApiAccess } from "@/lib/revenue-command-center/api-access"
import {
  cleanArray,
  cleanNumber,
  cleanString,
  logRevenueAction,
  logRevenueActivity,
} from "@/lib/revenue-command-center/canonical-server"

export const CAMPAIGN_STATUSES = [
  "draft", "strategy_preparation", "audience_preparation", "sequence_preparation",
  "readiness_review", "approval_required", "approved", "scheduled", "launching",
  "active", "paused", "recovery", "completed", "cancelled", "archived",
] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

const STATUS_ALIASES: Record<string, CampaignStatus> = {
  preparation: "strategy_preparation",
  ready: "readiness_review",
  pending_approval: "approval_required",
  running: "active",
  stopped: "paused",
  closed: "completed",
}

const TABLES = {
  segments: "revenue_campaign_segments",
  segmentVersions: "revenue_campaign_segment_versions",
  audienceSnapshots: "revenue_campaign_audience_snapshots",
  audienceMembers: "revenue_campaign_audience_members",
  recipients: "revenue_campaign_recipients",
  eligibility: "revenue_campaign_recipient_eligibility",
  suppressions: "revenue_campaign_suppressions",
  frequencyDecisions: "revenue_campaign_frequency_decisions",
  sequences: "revenue_campaign_sequences",
  sequenceVersions: "revenue_campaign_sequence_versions",
  sequenceSteps: "revenue_campaign_sequence_steps",
  sequenceBranches: "revenue_campaign_sequence_branches",
  templates: "revenue_campaign_templates",
  templateVersions: "revenue_campaign_template_versions",
  enrollments: "revenue_campaign_enrollments",
  stepExecutions: "revenue_campaign_step_executions",
  dispatchAttempts: "revenue_campaign_dispatch_attempts",
  replies: "revenue_campaign_replies",
  sdrAssignments: "revenue_campaign_sdr_assignments",
  providerReadiness: "revenue_campaign_provider_readiness",
  senderReadiness: "revenue_campaign_sender_readiness",
  conversionEvents: "revenue_campaign_conversion_events",
  attributions: "revenue_campaign_attributions",
  attributionConflicts: "revenue_campaign_attribution_conflicts",
  costs: "revenue_campaign_costs",
  performancePeriods: "revenue_campaign_performance_periods",
  experiments: "revenue_campaign_experiments",
  experimentVariants: "revenue_campaign_experiment_variants",
  risks: "revenue_campaign_risks",
  recoveryPlans: "revenue_campaign_recovery_plans",
  recoveryCheckpoints: "revenue_campaign_recovery_checkpoints",
  evidence: "revenue_campaign_evidence",
  approvals: "revenue_campaign_approvals",
  statusHistory: "revenue_campaign_status_history",
} as const

export function nowIso() { return new Date().toISOString() }
export function uuidOrNull(value: unknown) { const result = cleanString(value); return result || null }
export function textOrNull(value: unknown) { const result = cleanString(value); return result || null }
export function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
export function boolValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value
  const normalized = cleanString(value).toLowerCase()
  if (["true", "1", "yes", "oui"].includes(normalized)) return true
  if (["false", "0", "no", "non"].includes(normalized)) return false
  return fallback
}
export function normalizeCampaignStatus(value: unknown): CampaignStatus {
  const raw = cleanString(value, "draft").toLowerCase().replaceAll("-", "_").replaceAll(" ", "_")
  const normalized = STATUS_ALIASES[raw] || raw
  return CAMPAIGN_STATUSES.includes(normalized as CampaignStatus) ? normalized as CampaignStatus : "draft"
}

export async function campaignContext(permission: string | string[] = "revenue.campaigns.read") {
  const access = await requireRevenueApiAccess(permission)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    throw new Error("Phase 10 requires server-only Supabase service-role credentials. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
  }
  const supabase = createSupabaseAdmin(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return { access, supabase: supabase as any }
}

export function isMissingRelation(error: unknown) {
  const message = String((error as any)?.message || error || "")
  return /relation .* does not exist|table .* does not exist|schema cache|could not find the table|column .* does not exist|function .* does not exist/i.test(message)
}

export async function optionalRows(client: any, table: string, select = "*", configure?: (query: any) => any) {
  let query = client.from(table).select(select)
  if (configure) query = configure(query)
  const result = await query
  if (!result.error) return { rows: result.data || [], available: true }
  if (isMissingRelation(result.error)) return { rows: [], available: false, error: result.error.message }
  throw new Error(result.error.message)
}

export async function optionalOne(client: any, table: string, select: string, configure: (query: any) => any) {
  const result = await configure(client.from(table).select(select)).maybeSingle()
  if (!result.error) return { row: result.data || null, available: true }
  if (isMissingRelation(result.error)) return { row: null, available: false, error: result.error.message }
  throw new Error(result.error.message)
}

export async function getCampaign(client: any, id: string) {
  let result = await client.from("revenue_campaign_command_view").select("*").eq("id", id).maybeSingle()
  if (result.error && isMissingRelation(result.error)) result = await client.from("revenue_campaigns").select("*").eq("id", id).maybeSingle()
  if (result.error) throw new Error(result.error.message)
  return result.data || null
}

async function ensureCampaignCommunicationThread(client: any, recipient: Record<string, any>, actorId: string | null, actorName: string, channel: string) {
  if (recipient.communication_thread_id) {
    const existing = await optionalOne(client, "revenue_communication_threads", "*", (query) => query.eq("id", recipient.communication_thread_id))
    if (existing.row) return existing.row
  }
  const created = await insertOne(client, "revenue_communication_threads", {
    subject: `Campagne — ${recipient.display_name || recipient.contact_value || "Destinataire"}`,
    channel_scope: channel || recipient.channel || "mixed",
    status: "open",
    prospect_id: recipient.prospect_id || null,
    account_id: recipient.account_id || null,
    contact_id: recipient.contact_id || null,
    owner_id: actorId,
    owner_name: recipient.owner || actorName,
    metadata: { campaign_id: recipient.campaign_id, campaign_recipient_id: recipient.id },
  })
  await updateOne(client, TABLES.recipients, recipient.id, { communication_thread_id: created.id })
  return created
}

export function normalizeCampaignPayload(input: unknown) {
  const body = input && typeof input === "object" ? input as Record<string, unknown> : {}
  const channelMix = cleanArray(body.channelMix || body.channel_mix).map(String).filter(Boolean)
  return {
    name: cleanString(body.name, "Campagne sans nom"),
    audience: cleanString(body.audience, "Audience à définir"),
    objective: cleanString(body.objective, "Objectif commercial à définir"),
    channel: cleanString(body.channel, channelMix[0] || "multichannel"),
    channel_mix: channelMix.length ? channelMix : [cleanString(body.channel, "email")],
    campaign_type: cleanString(body.campaignType || body.campaign_type, "acquisition"),
    status: normalizeCampaignStatus(body.status),
    priority: cleanString(body.priority, "high"),
    owner: cleanString(body.owner, "Growth Lead"),
    owner_id: uuidOrNull(body.ownerId || body.owner_id),
    sdr_lead: cleanString(body.sdrLead || body.sdr_lead, "SDR Lead"),
    budget_mad: Math.max(0, cleanNumber(body.budgetMad || body.budget_mad, 0)),
    launch_at: textOrNull(body.launchAt || body.launch_at),
    end_at: textOrNull(body.endAt || body.end_at),
    approval_status: cleanString(body.approvalStatus || body.approval_status, "not_requested"),
    readiness_status: cleanString(body.readinessStatus || body.readiness_status, "not_evaluated"),
    audience_mode: cleanString(body.audienceMode || body.audience_mode, "frozen_snapshot"),
    attribution_model: cleanString(body.attributionModel || body.attribution_model, "rules_primary_source"),
    attribution_window_days: Math.max(1, Math.min(365, cleanNumber(body.attributionWindowDays || body.attribution_window_days, 60))),
    frequency_policy: {
      maxPerDay: Math.max(1, cleanNumber(body.maxPerDay, 2)),
      maxPerWeek: Math.max(1, cleanNumber(body.maxPerWeek, 5)),
      minHoursBetween: Math.max(1, cleanNumber(body.minHoursBetween, 20)),
      ...(objectValue(body.frequencyPolicy || body.frequency_policy)),
    },
    strategy: {
      pain: cleanString(body.pain),
      valueProposition: cleanString(body.valueProposition || body.value_proposition),
      intendedAction: cleanString(body.intendedAction || body.intended_action),
      expectedObjections: cleanString(body.expectedObjections || body.expected_objections),
      successCriteria: cleanString(body.successCriteria || body.success_criteria),
      stopCriteria: cleanString(body.stopCriteria || body.stop_criteria),
      geography: cleanString(body.geography),
      segment: cleanString(body.segment),
      serviceLine: cleanString(body.serviceLine || body.service_line),
      ...(objectValue(body.strategy)),
    },
    metadata: objectValue(body.metadata),
  }
}

async function recordCampaignEvent(client: any, input: {
  campaignId: string
  eventType: string
  title: string
  fromStatus?: string | null
  toStatus?: string | null
  reason?: string | null
  payload?: Record<string, unknown>
  result?: Record<string, unknown>
  actorId?: string | null
  severity?: string
}) {
  const row = {
    campaign_id: input.campaignId,
    event_type: input.eventType,
    title: input.title,
    from_status: input.fromStatus || null,
    to_status: input.toStatus || null,
    reason: input.reason || null,
    payload: input.payload || {},
    result: input.result || {},
    actor_id: input.actorId || null,
    occurred_at: nowIso(),
  }
  const inserted = await client.from(TABLES.statusHistory).insert(row)
  if (inserted.error && !isMissingRelation(inserted.error)) throw new Error(inserted.error.message)
  await logRevenueActivity(client, {
    entityType: "campaign",
    entityId: input.campaignId,
    eventType: input.eventType,
    title: input.title,
    body: input.reason || null,
    severity: input.severity || "info",
    metadata: { ...(input.payload || {}), ...(input.result || {}) },
  }).catch(() => undefined)
  await logRevenueAction(client, {
    actionType: input.eventType,
    entityType: "campaign",
    entityId: input.campaignId,
    payload: { ...(input.payload || {}), title: input.title, reason: input.reason || null },
    result: input.result || {},
  }).catch(() => undefined)
}

function sum(rows: Array<Record<string, any>>, field: string) {
  return rows.reduce((total, row) => total + Math.max(0, Number(row[field] || 0)), 0)
}
function count(rows: Array<Record<string, any>>, predicate: (row: Record<string, any>) => boolean) {
  return rows.filter(predicate).length
}

export async function loadCampaignPortfolio(client: any, campaignId?: string | null) {
  let campaignResult = await optionalRows(client, "revenue_campaign_command_view", "*", (query) => query.order("updated_at", { ascending: false }).limit(2500))
  if (!campaignResult.available) campaignResult = await optionalRows(client, "revenue_campaigns", "*", (query) => query.order("updated_at", { ascending: false }).limit(2500))
  const campaigns = campaignId ? campaignResult.rows.filter((row: any) => String(row.id) === campaignId) : campaignResult.rows
  const campaignIds = new Set(campaigns.map((row: any) => String(row.id)))

  const supportEntries = await Promise.all(Object.entries(TABLES).map(async ([key, table]) => {
    const rows = await optionalRows(client, table, "*", (query) => query.order("created_at", { ascending: false }).limit(6000))
    return [key, rows] as const
  }))
  const support: Record<string, Array<Record<string, any>>> = {}
  const schema: Record<string, boolean> = { revenue_campaigns: campaignResult.available }
  for (const [key, result] of supportEntries) {
    support[key] = result.rows
    schema[TABLES[key as keyof typeof TABLES]] = result.available
  }

  if (campaignId) {
    const directKeys = [
      "audienceSnapshots", "audienceMembers", "recipients", "eligibility", "frequencyDecisions",
      "sequences", "enrollments", "stepExecutions", "dispatchAttempts", "replies", "sdrAssignments",
      "providerReadiness", "senderReadiness", "conversionEvents", "attributions", "attributionConflicts",
      "costs", "performancePeriods", "experiments", "risks", "recoveryPlans", "evidence", "approvals", "statusHistory",
    ]
    for (const key of directKeys) support[key] = (support[key] || []).filter((row) => String(row.campaign_id || "") === campaignId)

    const snapshots = support.audienceSnapshots || []
    const segmentIds = new Set(snapshots.map((row) => String(row.segment_id || "")).filter(Boolean))
    const segmentVersionIds = new Set(snapshots.map((row) => String(row.segment_version_id || "")).filter(Boolean))
    support.segments = (support.segments || []).filter((row) => segmentIds.has(String(row.id)))
    support.segmentVersions = (support.segmentVersions || []).filter((row) => segmentVersionIds.has(String(row.id)) || segmentIds.has(String(row.segment_id)))

    const sequenceIds = new Set((support.sequences || []).map((row) => String(row.id)))
    const activeSequenceVersionIds = new Set((support.sequences || []).map((row) => String(row.active_version_id || "")).filter(Boolean))
    support.sequenceVersions = (support.sequenceVersions || []).filter((row) => sequenceIds.has(String(row.sequence_id)))
    for (const row of support.sequenceVersions || []) activeSequenceVersionIds.add(String(row.id))
    support.sequenceSteps = (support.sequenceSteps || []).filter((row) => sequenceIds.has(String(row.sequence_id)))
    support.sequenceBranches = (support.sequenceBranches || []).filter((row) => sequenceIds.has(String(row.sequence_id)) || activeSequenceVersionIds.has(String(row.sequence_version_id)))

    const templateIds = new Set((support.sequenceSteps || []).map((row) => String(row.template_id || "")).filter(Boolean))
    const templateVersionIds = new Set((support.sequenceSteps || []).map((row) => String(row.template_version_id || "")).filter(Boolean))
    support.templates = (support.templates || []).filter((row) => templateIds.has(String(row.id)))
    support.templateVersions = (support.templateVersions || []).filter((row) => templateIds.has(String(row.template_id)) || templateVersionIds.has(String(row.id)))

    const recipientProspects = new Set((support.recipients || []).map((row) => String(row.prospect_id || "")).filter(Boolean))
    const recipientContacts = new Set((support.recipients || []).map((row) => String(row.contact_id || "")).filter(Boolean))
    const recipientValues = new Set((support.recipients || []).map((row) => String(row.contact_value_normalized || "")).filter(Boolean))
    support.suppressions = (support.suppressions || []).filter((row) =>
      String(row.campaign_id || "") === campaignId || (!row.campaign_id && (
        recipientProspects.has(String(row.prospect_id || "")) ||
        recipientContacts.has(String(row.contact_id || "")) ||
        recipientValues.has(String(row.contact_value_normalized || ""))
      ))
    )

    const experimentIds = new Set((support.experiments || []).map((row) => String(row.id)))
    support.experimentVariants = (support.experimentVariants || []).filter((row) => experimentIds.has(String(row.experiment_id)))
    const recoveryPlanIds = new Set((support.recoveryPlans || []).map((row) => String(row.id)))
    support.recoveryCheckpoints = (support.recoveryCheckpoints || []).filter((row) => recoveryPlanIds.has(String(row.recovery_plan_id)))
  }

  const [communications, deliveryEvents, tasks, appointments, opportunities, proposals, contracts, realizationEvents, senderIdentities] = await Promise.all([
    optionalRows(client, "revenue_communication_events", "*", (query) => query.order("created_at", { ascending: false }).limit(6000)),
    optionalRows(client, "revenue_communication_delivery_events", "*", (query) => query.order("created_at", { ascending: false }).limit(6000)),
    optionalRows(client, "revenue_tasks", "*", (query) => query.order("created_at", { ascending: false }).limit(6000)),
    optionalRows(client, "revenue_appointments", "*", (query) => query.order("created_at", { ascending: false }).limit(3000)),
    optionalRows(client, "revenue_opportunities", "*", (query) => query.order("updated_at", { ascending: false }).limit(3000)),
    optionalRows(client, "revenue_proposals", "*", (query) => query.order("updated_at", { ascending: false }).limit(3000)),
    optionalRows(client, "revenue_contracts", "*", (query) => query.order("updated_at", { ascending: false }).limit(3000)),
    optionalRows(client, "revenue_realization_events", "*", (query) => query.order("created_at", { ascending: false }).limit(5000)),
    optionalRows(client, "email_os_sender_identities", "*", (query) => query.order("updated_at", { ascending: false }).limit(500)),
  ])

  const filterCampaign = (rows: Array<Record<string, any>>) => campaignId
    ? rows.filter((row) => String(row.campaign_id || row.metadata?.campaign_id || "") === campaignId)
    : rows
  const communicationsRows = filterCampaign(communications.rows)
  const communicationIds = new Set(communicationsRows.map((row: any) => row.id))
  const deliveryRows = campaignId ? deliveryEvents.rows.filter((row: any) => communicationIds.has(row.communication_event_id)) : deliveryEvents.rows
  const taskRows = filterCampaign(tasks.rows)
  const appointmentRows = filterCampaign(appointments.rows)
  const opportunityRows = filterCampaign(opportunities.rows)
  const proposalRows = filterCampaign(proposals.rows)
  const contractRows = filterCampaign(contracts.rows)
  const realizationRows = filterCampaign(realizationEvents.rows)

  const recipients = support.recipients || []
  const replies = support.replies || []
  const costs = support.costs || []
  const attributions = support.attributions || []
  const dispatchAttempts = support.dispatchAttempts || []
  const activeStatuses = new Set(["active", "launching", "scheduled"])
  const summary = {
    total: campaigns.length,
    draft: count(campaigns, (row) => ["draft", "strategy_preparation", "audience_preparation", "sequence_preparation"].includes(String(row.status))),
    approvalRequired: count(campaigns, (row) => String(row.status) === "approval_required" || String(row.approval_status) === "pending"),
    scheduled: count(campaigns, (row) => String(row.status) === "scheduled"),
    active: count(campaigns, (row) => activeStatuses.has(String(row.status))),
    paused: count(campaigns, (row) => String(row.status) === "paused"),
    atRisk: count(campaigns, (row) => ["at_risk", "blocked", "recovery"].includes(String(row.risk_status || row.status))),
    completed: count(campaigns, (row) => String(row.status) === "completed"),
    eligibleAudience: count(support.eligibility || [], (row) => String(row.decision) === "eligible"),
    enrolled: count(recipients, (row) => !["removed", "suppressed", "invalid"].includes(String(row.status))),
    contacted: count(recipients, (row) => ["contacted", "engaged", "qualified", "meeting", "opportunity", "converted", "completed"].includes(String(row.status))),
    replies: replies.length,
    positiveReplies: count(replies, (row) => ["positive_interest", "meeting_request", "information_request"].includes(String(row.classification))),
    meetings: appointmentRows.length || count(support.conversionEvents || [], (row) => String(row.event_type) === "meeting_created"),
    opportunities: opportunityRows.length || count(support.conversionEvents || [], (row) => String(row.event_type) === "opportunity_created"),
    proposals: proposalRows.length || count(support.conversionEvents || [], (row) => String(row.event_type) === "proposal_created"),
    contracts: contractRows.length || count(support.conversionEvents || [], (row) => String(row.event_type) === "contract_signed"),
    realizedMad: sum(attributions.filter((row) => row.event_type === "revenue_realized" && ["active", "confirmed", "attributed"].includes(String(row.status))), "attributed_value"),
    estimatedCostMad: sum(costs.filter((row) => String(row.cost_state) === "estimated"), "amount_mad"),
    confirmedCostMad: sum(costs.filter((row) => String(row.cost_state) === "confirmed"), "amount_mad"),
    openSuppressions: count(support.suppressions || [], (row) => String(row.status) === "active"),
    providerFailures: count(dispatchAttempts, (row) => ["failed", "provider_rejected", "hard_bounce"].includes(String(row.status))),
    sdrBacklog: count(support.stepExecutions || [], (row) => ["scheduled", "due", "overdue", "manual_review"].includes(String(row.status))),
  }

  return {
    campaigns,
    ...support,
    communications: communicationsRows,
    deliveryEvents: deliveryRows,
    tasks: taskRows,
    appointments: appointmentRows,
    opportunities: opportunityRows,
    proposals: proposalRows,
    contracts: contractRows,
    realizationEvents: realizationRows,
    senderIdentities: senderIdentities.rows,
    summary,
    schema: {
      ...schema,
      revenue_communication_events: communications.available,
      revenue_communication_delivery_events: deliveryEvents.available,
      revenue_tasks: tasks.available,
      revenue_appointments: appointments.available,
      revenue_opportunities: opportunities.available,
      revenue_proposals: proposals.available,
      revenue_contracts: contracts.available,
      revenue_realization_events: realizationEvents.available,
      email_os_sender_identities: senderIdentities.available,
    },
    syncedAt: nowIso(),
  }
}

async function insertOne(client: any, table: string, row: Record<string, unknown>) {
  const result = await client.from(table).insert(row).select("*").single()
  if (result.error) throw new Error(result.error.message)
  return result.data
}
async function updateOne(client: any, table: string, id: string, patch: Record<string, unknown>) {
  const result = await client.from(table).update({ ...patch, updated_at: nowIso() }).eq("id", id).select("*").single()
  if (result.error) throw new Error(result.error.message)
  return result.data
}
async function rpcOne(client: any, name: string, args: Record<string, unknown>) {
  const result = await client.rpc(name, args)
  if (result.error) throw new Error(result.error.message)
  return Array.isArray(result.data) ? result.data[0] : result.data
}

const TRANSITIONS: Record<string, string[]> = {
  draft: ["strategy_preparation", "cancelled"],
  strategy_preparation: ["audience_preparation", "cancelled"],
  audience_preparation: ["sequence_preparation", "strategy_preparation", "cancelled"],
  sequence_preparation: ["readiness_review", "audience_preparation", "cancelled"],
  readiness_review: ["approval_required", "sequence_preparation", "recovery", "cancelled"],
  approval_required: ["approved", "strategy_preparation", "cancelled"],
  approved: ["scheduled", "launching", "cancelled"],
  scheduled: ["launching", "paused", "cancelled"],
  launching: ["active", "paused", "recovery", "cancelled"],
  active: ["paused", "recovery", "completed", "cancelled"],
  paused: ["active", "recovery", "cancelled"],
  recovery: ["readiness_review", "active", "cancelled"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
}

const CAMPAIGN_OPERATION_PERMISSIONS: Record<string, string> = {
  "create-campaign": "revenue.campaigns.manage",
  "edit-campaign": "revenue.campaigns.manage",
  "transition-campaign": "revenue.campaigns.manage",
  "create-segment": "revenue.campaigns.audience.manage",
  "freeze-audience": "revenue.campaigns.audience.manage",
  "evaluate-eligibility": "revenue.campaigns.audience.manage",
  "suppress-recipient": "revenue.campaigns.suppression.manage",
  "remove-suppression": "revenue.campaigns.suppression.override",
  "create-sequence": "revenue.campaigns.sequences.manage",
  "add-sequence-step": "revenue.campaigns.sequences.manage",
  "approve-sequence": "revenue.campaigns.sequences.approve",
  "create-template": "revenue.campaigns.templates.manage",
  "approve-template": "revenue.campaigns.templates.approve",
  "record-provider-readiness": "revenue.campaigns.readiness.manage",
  "record-sender-readiness": "revenue.campaigns.readiness.manage",
  "evaluate-readiness": "revenue.campaigns.readiness.manage",
  "request-approval": "revenue.campaigns.approval.request",
  "decide-approval": "revenue.campaigns.approve",
  "launch-campaign": "revenue.campaigns.launch",
  "pause-campaign": "revenue.campaigns.manage",
  "resume-campaign": "revenue.campaigns.manage",
  "emergency-stop": "revenue.campaigns.emergency_stop",
  "enroll-recipient": "revenue.campaigns.enroll",
  "remove-recipient": "revenue.campaigns.enroll",
  "dispatch-step": "revenue.campaigns.dispatch",
  "record-provider-event": "revenue.campaigns.delivery.manage",
  "record-reply": "revenue.campaigns.responses.manage",
  "record-call-outcome": "revenue.campaigns.responses.manage",
  "create-meeting-conversion": "revenue.campaigns.convert",
  "create-opportunity-conversion": "revenue.campaigns.convert",
  "create-attribution": "revenue.campaigns.attribution.manage",
  "raise-attribution-conflict": "revenue.campaigns.attribution.manage",
  "resolve-attribution-conflict": "revenue.campaigns.attribution.resolve",
  "record-cost": "revenue.campaigns.costs.manage",
  "create-performance-period": "revenue.campaigns.performance.manage",
  "close-performance-period": "revenue.campaigns.performance.close",
  "create-experiment": "revenue.campaigns.experiments.manage",
  "create-recovery-plan": "revenue.campaigns.recovery.manage",
  "complete-recovery-checkpoint": "revenue.campaigns.recovery.manage",
  "record-evidence": "revenue.campaigns.evidence.manage",
}

export async function runCampaignCommand(operation: string, body: Record<string, any>) {
  let specificPermission = CAMPAIGN_OPERATION_PERMISSIONS[operation] || "revenue.campaigns.manage"
  if (operation === "create-attribution" && cleanString(body.overrideReason)) specificPermission = "revenue.campaigns.attribution.override"
  if (operation === "record-cost" && cleanString(body.costState) === "confirmed") specificPermission = "revenue.campaigns.costs.confirm"
  const strictAuthority = new Set([
    "remove-suppression", "approve-sequence", "approve-template", "decide-approval", "launch-campaign",
    "emergency-stop", "resolve-attribution-conflict", "close-performance-period",
  ]).has(operation) || specificPermission.endsWith(".override") || specificPermission.endsWith(".confirm")
  const { access, supabase } = await campaignContext(strictAuthority ? specificPermission : [specificPermission, "revenue.campaigns.manage"])
  const actorId = (access.user as any).id || null
  const actorName = String((access.user as any).email || "Revenue Command")
  const campaignId = cleanString(body.campaignId || body.id)
  const campaign = campaignId ? await getCampaign(supabase, campaignId) : null
  const requireCampaign = () => {
    if (!campaignId || !campaign) throw new Error("Campagne introuvable.")
    return campaign
  }

  if (operation === "create-campaign") {
    const row = normalizeCampaignPayload(body)
    const reference = cleanString(body.reference) || `AC-CAM-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`
    const created = await insertOne(supabase, "revenue_campaigns", { ...row, reference, created_by: actorId, updated_by: actorId, created_at: nowIso(), updated_at: nowIso() })
    await recordCampaignEvent(supabase, { campaignId: created.id, eventType: "campaign_created", title: `Campagne créée : ${created.name}`, toStatus: created.status, payload: body, result: { id: created.id }, actorId })
    return { campaign: created }
  }

  if (operation === "edit-campaign") {
    const current = requireCampaign()
    const normalized = normalizeCampaignPayload({ ...current, ...body })
    const updated = await updateOne(supabase, "revenue_campaigns", campaignId, normalized)
    await recordCampaignEvent(supabase, { campaignId, eventType: "campaign_updated", title: `Stratégie mise à jour : ${updated.name}`, payload: body, result: { id: updated.id }, actorId })
    return { campaign: updated }
  }

  if (operation === "transition-campaign") {
    const current = requireCampaign()
    const fromStatus = normalizeCampaignStatus(current.status)
    const toStatus = normalizeCampaignStatus(body.toStatus || body.status)
    if (!TRANSITIONS[fromStatus]?.includes(toStatus)) throw new Error(`Transition non autorisée : ${fromStatus} → ${toStatus}`)
    const reason = cleanString(body.reason)
    if (["cancelled", "recovery", "paused"].includes(toStatus) && !reason) throw new Error("Un motif est requis pour cette transition.")
    const updated = await updateOne(supabase, "revenue_campaigns", campaignId, { status: toStatus, completed_at: toStatus === "completed" ? nowIso() : current.completed_at || null })
    await recordCampaignEvent(supabase, { campaignId, eventType: "campaign_transitioned", title: `Campagne déplacée : ${fromStatus} → ${toStatus}`, fromStatus, toStatus, reason, payload: body, result: { status: toStatus }, actorId, severity: ["cancelled", "recovery"].includes(toStatus) ? "warning" : "info" })
    return { campaign: updated, transition: { fromStatus, toStatus } }
  }

  if (operation === "create-segment") {
    const row = {
      name: cleanString(body.name, "Segment sans nom"),
      entity_type: cleanString(body.entityType, "prospect"),
      objective: cleanString(body.objective),
      filter_definition: objectValue(body.filterDefinition || body.filters),
      exclusion_definition: objectValue(body.exclusionDefinition || body.exclusions),
      owner: cleanString(body.owner, actorName),
      visibility: cleanString(body.visibility, "team"),
      status: "draft",
      created_by: actorId,
    }
    return { segment: await insertOne(supabase, TABLES.segments, row) }
  }

  if (operation === "freeze-audience") {
    requireCampaign()
    const members = Array.isArray(body.members) ? body.members : []
    const snapshot = await rpcOne(supabase, "revenue_freeze_campaign_audience", {
      p_campaign_id: campaignId,
      p_segment_id: uuidOrNull(body.segmentId),
      p_segment_version_id: uuidOrNull(body.segmentVersionId),
      p_mode: cleanString(body.mode, "frozen"),
      p_filter_snapshot: objectValue(body.filterSnapshot || body.filters),
      p_members: members,
      p_actor_id: actorId,
    })
    return { audienceSnapshot: snapshot }
  }

  if (operation === "evaluate-eligibility") {
    requireCampaign()
    const result = await rpcOne(supabase, "revenue_evaluate_campaign_recipient", {
      p_campaign_id: campaignId,
      p_prospect_id: textOrNull(body.prospectId),
      p_contact_id: uuidOrNull(body.contactId),
      p_channel: cleanString(body.channel, "email"),
      p_contact_value: cleanString(body.contactValue),
      p_actor_id: actorId,
    })
    return { eligibility: result }
  }

  if (operation === "suppress-recipient") {
    const result = await insertOne(supabase, TABLES.suppressions, {
      campaign_id: uuidOrNull(campaignId),
      prospect_id: textOrNull(body.prospectId),
      contact_id: uuidOrNull(body.contactId),
      contact_value_normalized: cleanString(body.contactValue).toLowerCase() || null,
      channel: cleanString(body.channel, "all"),
      scope: cleanString(body.scope, "global"),
      reason: cleanString(body.reason, "manual_suppression"),
      status: "active",
      effective_at: nowIso(),
      expires_at: textOrNull(body.expiresAt),
      source_event_id: uuidOrNull(body.sourceEventId),
      evidence: objectValue(body.evidence),
      created_by: actorId,
    })
    return { suppression: result }
  }

  if (operation === "remove-suppression") {
    const id = cleanString(body.suppressionId || body.id)
    if (!id || !cleanString(body.reason)) throw new Error("Suppression et motif requis.")
    return { suppression: await updateOne(supabase, TABLES.suppressions, id, { status: "revoked", revoked_at: nowIso(), revoked_by: actorId, revocation_reason: cleanString(body.reason) }) }
  }

  if (operation === "create-sequence") {
    const result = await insertOne(supabase, TABLES.sequences, {
      campaign_id: uuidOrNull(campaignId),
      name: cleanString(body.name, "Séquence sans nom"),
      objective: cleanString(body.objective),
      target_entity_type: cleanString(body.targetEntityType, "prospect"),
      entry_criteria: objectValue(body.entryCriteria),
      exit_criteria: objectValue(body.exitCriteria),
      pause_rules: objectValue(body.pauseRules),
      frequency_limits: objectValue(body.frequencyLimits),
      status: "draft",
      owner: cleanString(body.owner, actorName),
      created_by: actorId,
    })
    return { sequence: result }
  }

  if (operation === "add-sequence-step") {
    const sequenceId = cleanString(body.sequenceId)
    if (!sequenceId) throw new Error("Séquence requise.")
    const result = await insertOne(supabase, TABLES.sequenceSteps, {
      sequence_id: sequenceId,
      sequence_version_id: uuidOrNull(body.sequenceVersionId),
      step_order: Math.max(1, cleanNumber(body.stepOrder, 1)),
      step_type: cleanString(body.stepType, "email"),
      channel: cleanString(body.channel, body.stepType || "email"),
      delay_minutes: Math.max(0, cleanNumber(body.delayMinutes, 0)),
      allowed_window: objectValue(body.allowedWindow),
      template_id: uuidOrNull(body.templateId),
      sender_identity_id: textOrNull(body.senderIdentityId),
      owner_role: cleanString(body.ownerRole, "SDR"),
      preconditions: objectValue(body.preconditions),
      skip_conditions: objectValue(body.skipConditions),
      success_conditions: objectValue(body.successConditions),
      failure_behavior: objectValue(body.failureBehavior),
      reply_behavior: objectValue(body.replyBehavior),
      retry_policy: objectValue(body.retryPolicy),
      status: "draft",
      created_by: actorId,
    })
    return { step: result }
  }

  if (operation === "approve-sequence") {
    const sequenceId = cleanString(body.sequenceId)
    if (!sequenceId) throw new Error("Séquence requise.")
    return { sequenceVersion: await rpcOne(supabase, "revenue_approve_campaign_sequence", {
      p_sequence_id: sequenceId,
      p_version_number: body.versionNumber === undefined || body.versionNumber === "" ? null : Math.max(1, cleanNumber(body.versionNumber, 1)),
      p_actor_id: actorId,
    }) }
  }

  if (operation === "create-template") {
    const result = await insertOne(supabase, TABLES.templates, {
      name: cleanString(body.name, "Template sans nom"),
      channel: cleanString(body.channel, "email"),
      language: cleanString(body.language, "fr"),
      target_audience: cleanString(body.targetAudience, "prospects"),
      objective: cleanString(body.objective),
      subject: cleanString(body.subject),
      body: cleanString(body.body),
      variables: cleanArray(body.variables),
      required_disclosures: cleanArray(body.requiredDisclosures),
      status: "draft",
      owner: cleanString(body.owner, actorName),
      created_by: actorId,
    })
    return { template: result }
  }

  if (operation === "approve-template") {
    const templateId = cleanString(body.templateId)
    const template = await optionalOne(supabase, TABLES.templates, "*", (query) => query.eq("id", templateId))
    if (!template.row) throw new Error("Template introuvable.")
    const version = await insertOne(supabase, TABLES.templateVersions, {
      template_id: templateId,
      version_number: Math.max(1, cleanNumber(body.versionNumber, Number(template.row.current_version || 0) + 1)),
      subject: template.row.subject || "",
      body: template.row.body || "",
      variables: template.row.variables || [],
      status: "approved",
      approved_by: actorId,
      approved_at: nowIso(),
    })
    await updateOne(supabase, TABLES.templates, templateId, { status: "approved", active_version_id: version.id, current_version: version.version_number })
    return { templateVersion: version }
  }

  if (operation === "record-provider-readiness" || operation === "record-sender-readiness") {
    requireCampaign()
    const table = operation === "record-provider-readiness" ? TABLES.providerReadiness : TABLES.senderReadiness
    const row = {
      campaign_id: campaignId,
      channel: cleanString(body.channel, "email"),
      provider: cleanString(body.provider, "manual"),
      sender_identity_id: textOrNull(body.senderIdentityId),
      status: cleanString(body.status, "unknown"),
      checks: objectValue(body.checks),
      daily_limit: Math.max(0, cleanNumber(body.dailyLimit, 0)),
      available_capacity: Math.max(0, cleanNumber(body.availableCapacity, 0)),
      recent_failure_rate: Math.max(0, Math.min(100, cleanNumber(body.recentFailureRate, 0))),
      evidence: objectValue(body.evidence),
      checked_by: actorId,
      checked_at: nowIso(),
    }
    return { readiness: await insertOne(supabase, table, row) }
  }

  if (operation === "evaluate-readiness") {
    requireCampaign()
    return { readiness: await rpcOne(supabase, "revenue_evaluate_campaign_readiness", { p_campaign_id: campaignId, p_actor_id: actorId }) }
  }

  if (operation === "request-approval") {
    requireCampaign()
    const approval = await insertOne(supabase, TABLES.approvals, {
      campaign_id: campaignId,
      approval_type: cleanString(body.approvalType, "launch"),
      title: cleanString(body.title, "Validation lancement campagne"),
      reason: cleanString(body.reason),
      risk_level: cleanString(body.riskLevel, "medium"),
      status: "pending",
      requested_by: actorId,
      requested_at: nowIso(),
      due_at: textOrNull(body.dueAt),
      evidence: objectValue(body.evidence),
    })
    await updateOne(supabase, "revenue_campaigns", campaignId, { status: "approval_required", approval_status: "pending" })
    return { approval }
  }

  if (operation === "decide-approval") {
    const approvalId = cleanString(body.approvalId)
    const decision = cleanString(body.decision)
    if (!approvalId || !["approved", "rejected", "correction_required", "approved_with_limits"].includes(decision)) throw new Error("Décision d’approbation invalide.")
    if (["rejected", "correction_required", "approved_with_limits"].includes(decision) && !cleanString(body.reason)) throw new Error("Un motif est requis.")
    const approval = await updateOne(supabase, TABLES.approvals, approvalId, { status: decision, decision_reason: cleanString(body.reason), limitations: objectValue(body.limitations), decided_by: actorId, decided_at: nowIso() })
    if (approval.campaign_id) await updateOne(supabase, "revenue_campaigns", approval.campaign_id, { approval_status: decision, status: decision.startsWith("approved") ? "approved" : "strategy_preparation" })
    return { approval }
  }

  if (operation === "launch-campaign") {
    requireCampaign()
    return { launch: await rpcOne(supabase, "revenue_launch_campaign", { p_campaign_id: campaignId, p_actor_id: actorId, p_idempotency_key: cleanString(body.idempotencyKey, `launch-${campaignId}`) }) }
  }

  if (["pause-campaign", "resume-campaign", "emergency-stop"].includes(operation)) {
    const current = requireCampaign()
    const reason = cleanString(body.reason)
    if (!reason) throw new Error("Un motif est requis.")
    const status = operation === "resume-campaign" ? "active" : "paused"
    const updated = await updateOne(supabase, "revenue_campaigns", campaignId, { status, pause_reason: operation === "resume-campaign" ? null : reason, emergency_stopped: operation === "emergency-stop", emergency_stopped_at: operation === "emergency-stop" ? nowIso() : current.emergency_stopped_at || null })
    await recordCampaignEvent(supabase, { campaignId, eventType: operation.replaceAll("-", "_"), title: operation === "emergency-stop" ? "Arrêt d’urgence activé" : operation === "resume-campaign" ? "Campagne reprise" : "Campagne mise en pause", fromStatus: current.status, toStatus: status, reason, actorId, severity: operation === "emergency-stop" ? "critical" : "warning" })
    return { campaign: updated }
  }

  if (operation === "enroll-recipient") {
    requireCampaign()
    return { enrollment: await rpcOne(supabase, "revenue_enroll_campaign_recipient", {
      p_campaign_id: campaignId,
      p_prospect_id: textOrNull(body.prospectId),
      p_contact_id: uuidOrNull(body.contactId),
      p_sequence_version_id: uuidOrNull(body.sequenceVersionId),
      p_channel: cleanString(body.channel, "email"),
      p_contact_value: cleanString(body.contactValue),
      p_owner: cleanString(body.owner, actorName),
      p_actor_id: actorId,
      p_idempotency_key: cleanString(body.idempotencyKey, `${campaignId}-${body.prospectId || body.contactId || body.contactValue}`),
    }) }
  }

  if (operation === "remove-recipient") {
    const recipientId = cleanString(body.recipientId)
    const reason = cleanString(body.reason)
    if (!recipientId || !reason) throw new Error("Destinataire et motif requis.")
    const recipient = await optionalOne(supabase, TABLES.recipients, "*", (query) => query.eq("id", recipientId))
    if (!recipient.row) throw new Error("Destinataire introuvable.")
    await updateOne(supabase, TABLES.recipients, recipientId, { status: "removed", completed_at: nowIso(), last_action_at: nowIso(), metadata: { ...objectValue(recipient.row.metadata), removal_reason: reason } })
    await supabase.from(TABLES.enrollments).update({ status: "terminated", exit_reason: `removed:${reason}`, completed_at: nowIso(), updated_by: actorId, updated_at: nowIso() }).eq("campaign_recipient_id", recipientId).in("status", ["active", "paused"])
    await supabase.from(TABLES.stepExecutions).update({ status: "cancelled", last_error: `recipient_removed:${reason}`, updated_by: actorId, updated_at: nowIso() }).eq("campaign_recipient_id", recipientId).in("status", ["scheduled", "due", "overdue", "prepared", "manual_review"])
    await recordCampaignEvent(supabase, { campaignId: recipient.row.campaign_id, eventType: "campaign_recipient_removed", title: `Destinataire retiré : ${recipient.row.display_name || recipientId}`, reason, actorId, result: { recipientId } })
    return { recipientId, status: "removed" }
  }

  if (operation === "dispatch-step") {
    return { dispatch: await rpcOne(supabase, "revenue_dispatch_campaign_step", {
      p_execution_id: cleanString(body.executionId),
      p_provider: cleanString(body.provider, "manual"),
      p_provider_message_id: textOrNull(body.providerMessageId),
      p_actor_id: actorId,
      p_idempotency_key: cleanString(body.idempotencyKey, `dispatch-${body.executionId}`),
    }) }
  }

  if (operation === "record-provider-event") {
    const communicationEventId = cleanString(body.communicationEventId)
    if (!communicationEventId) throw new Error("Événement de communication requis.")
    return { providerEvent: await rpcOne(supabase, "revenue_record_campaign_provider_event", {
      p_communication_event_id: communicationEventId,
      p_event_type: cleanString(body.eventType, "provider_accepted"),
      p_provider: cleanString(body.provider, "manual"),
      p_provider_event_id: textOrNull(body.providerEventId),
      p_occurred_at: textOrNull(body.occurredAt),
      p_details: objectValue(body.details),
      p_actor_id: actorId,
    }) }
  }

  if (operation === "record-reply") {
    return { reply: await rpcOne(supabase, "revenue_process_campaign_reply", {
      p_campaign_recipient_id: cleanString(body.recipientId),
      p_channel: cleanString(body.channel, "email"),
      p_classification: cleanString(body.classification, "needs_human_review"),
      p_message: cleanString(body.message),
      p_provider_message_id: textOrNull(body.providerMessageId),
      p_actor_id: actorId,
    }) }
  }

  if (operation === "record-call-outcome") {
    const recipientId = cleanString(body.recipientId)
    if (!recipientId) throw new Error("Destinataire requis.")
    const recipient = await optionalOne(supabase, TABLES.recipients, "*", (query) => query.eq("id", recipientId))
    if (!recipient.row) throw new Error("Destinataire introuvable.")
    const thread = await ensureCampaignCommunicationThread(supabase, recipient.row, actorId, actorName, "call")
    const event = await insertOne(supabase, "revenue_communication_events", {
      thread_id: thread.id,
      campaign_id: recipient.row.campaign_id,
      campaign_recipient_id: recipientId,
      prospect_id: recipient.row.prospect_id || null,
      contact_id: recipient.row.contact_id || null,
      direction: "outbound",
      channel: "call",
      provider: cleanString(body.provider, "manual"),
      sender: actorName,
      recipients: [recipient.row.contact_value].filter(Boolean),
      subject: "Appel SDR campagne",
      body_summary: cleanString(body.notes),
      content: { outcome: cleanString(body.outcome), duration_seconds: Math.max(0, cleanNumber(body.durationSeconds, 0)) },
      occurred_at: textOrNull(body.occurredAt) || nowIso(),
      status: "recorded",
      outcome: cleanString(body.outcome, "completed"),
      owner_id: actorId,
      owner_name: actorName,
      metadata: { campaign_id: recipient.row.campaign_id, recipient_id: recipientId },
    })
    const outcome = cleanString(body.outcome, "completed")
    if (["positive", "callback_requested", "meeting_scheduled"].includes(outcome)) {
      await updateOne(supabase, TABLES.recipients, recipientId, { status: outcome === "meeting_scheduled" ? "meeting" : "engaged", last_action_at: nowIso() })
    } else if (["wrong_number", "suppression_requested"].includes(outcome)) {
      await insertOne(supabase, TABLES.suppressions, {
        campaign_id: outcome === "suppression_requested" ? null : recipient.row.campaign_id,
        prospect_id: recipient.row.prospect_id || null,
        contact_id: recipient.row.contact_id || null,
        contact_value_normalized: recipient.row.contact_value_normalized || null,
        channel: "call",
        scope: outcome === "suppression_requested" ? "channel" : "campaign",
        reason: outcome,
        status: "active",
        source_event_id: event.id,
        created_by: actorId,
      })
      await updateOne(supabase, TABLES.recipients, recipientId, { status: outcome === "suppression_requested" ? "opted_out" : "invalid", last_action_at: nowIso() })
    }
    return { communicationEvent: event, outcome }
  }

  if (["create-meeting-conversion", "create-opportunity-conversion"].includes(operation)) {
    const recipientId = cleanString(body.recipientId)
    const recipient = await optionalOne(supabase, TABLES.recipients, "*", (query) => query.eq("id", recipientId))
    if (!recipient.row) throw new Error("Destinataire introuvable.")
    let target: any
    let eventType: string
    if (operation === "create-meeting-conversion") {
      target = await insertOne(supabase, "revenue_appointments", {
        entity_type: recipient.row.prospect_id ? "prospect" : "campaign_recipient",
        entity_id: recipient.row.prospect_id || recipientId,
        prospect_id: recipient.row.prospect_id || null,
        title: cleanString(body.title, "Meeting issu de campagne"),
        appointment_type: cleanString(body.appointmentType, "discovery"),
        appointment_at: textOrNull(body.appointmentAt) || nowIso(),
        location: cleanString(body.location),
        meeting_link: cleanString(body.meetingLink),
        objective: cleanString(body.objective),
        expected_outcome: cleanString(body.expectedOutcome),
        owner: cleanString(body.owner, actorName),
        status: "scheduled",
        metadata: { campaign_id: recipient.row.campaign_id, campaign_recipient_id: recipientId },
      })
      eventType = "meeting_created"
    } else {
      target = await insertOne(supabase, "revenue_opportunities", {
        prospect_id: recipient.row.prospect_id || null,
        account_id: recipient.row.account_id || null,
        contact_id: recipient.row.contact_id || null,
        title: cleanString(body.title, "Opportunité issue de campagne"),
        stage: "qualification",
        status: "open",
        value_mad: Math.max(0, cleanNumber(body.valueMad, 0)),
        probability: Math.max(0, Math.min(100, cleanNumber(body.probability, 20))),
        owner: cleanString(body.owner, actorName),
        next_step: cleanString(body.nextStep, "Qualifier l’opportunité"),
        metadata: { campaign_id: recipient.row.campaign_id, campaign_recipient_id: recipientId },
      })
      eventType = "opportunity_created"
    }
    const conversion = await insertOne(supabase, TABLES.conversionEvents, {
      campaign_id: recipient.row.campaign_id,
      campaign_recipient_id: recipientId,
      event_type: eventType,
      target_entity_type: eventType === "meeting_created" ? "appointment" : "opportunity",
      target_entity_id: target.id,
      evidence: objectValue(body.evidence),
      occurred_at: nowIso(),
      created_by: actorId,
    })
    await updateOne(supabase, TABLES.recipients, recipientId, {
      status: eventType === "meeting_created" ? "meeting" : "opportunity",
      last_action_at: nowIso(),
      metadata: { ...(objectValue(recipient.row.metadata)), last_conversion_event_id: conversion.id, last_conversion_target_id: target.id },
    })
    return { target, conversion }
  }

  if (operation === "create-attribution") {
    requireCampaign()
    return { attribution: await rpcOne(supabase, "revenue_create_campaign_attribution", {
      p_campaign_id: campaignId,
      p_campaign_recipient_id: uuidOrNull(body.recipientId),
      p_event_type: cleanString(body.eventType),
      p_event_id: cleanString(body.eventId),
      p_attribution_model: cleanString(body.attributionModel, "rules_primary_source"),
      p_attribution_share: Math.max(0.01, Math.min(100, cleanNumber(body.attributionShare, 100))),
      p_attributed_value: Math.max(0, cleanNumber(body.attributedValue, 0)),
      p_evidence_reference: cleanString(body.evidenceReference),
      p_override_reason: textOrNull(body.overrideReason),
      p_actor_id: actorId,
    }) }
  }

  if (operation === "raise-attribution-conflict") {
    requireCampaign()
    return { conflict: await insertOne(supabase, TABLES.attributionConflicts, {
      campaign_id: campaignId,
      campaign_recipient_id: uuidOrNull(body.recipientId),
      conflict_type: cleanString(body.conflictType, "source_conflict"),
      description: cleanString(body.description || body.reason),
      competing_source_type: textOrNull(body.competingSourceType),
      competing_source_id: textOrNull(body.competingSourceId),
      event_type: textOrNull(body.eventType),
      event_id: textOrNull(body.eventId),
      value_at_risk_mad: Math.max(0, cleanNumber(body.valueAtRiskMad, 0)),
      status: "open",
      created_by: actorId,
    }) }
  }

  if (operation === "resolve-attribution-conflict") {
    const conflictId = cleanString(body.conflictId)
    if (!conflictId || !cleanString(body.reason)) throw new Error("Conflit et motif requis.")
    return { conflict: await updateOne(supabase, TABLES.attributionConflicts, conflictId, { status: "resolved", decision: cleanString(body.decision), resolution_reason: cleanString(body.reason), resolved_by: actorId, resolved_at: nowIso() }) }
  }

  if (operation === "record-cost") {
    requireCampaign()
    const costState = cleanString(body.costState, "estimated")
    if (costState === "confirmed" && !cleanString(body.financeReference)) throw new Error("Une référence Finance est requise pour confirmer un coût.")
    return { cost: await insertOne(supabase, TABLES.costs, {
      campaign_id: campaignId,
      category: cleanString(body.category, "provider_usage"),
      label: cleanString(body.label, "Coût campagne"),
      amount_mad: Math.max(0, cleanNumber(body.amountMad, 0)),
      currency: cleanString(body.currency, "MAD"),
      cost_state: costState,
      occurred_on: textOrNull(body.occurredOn) || nowIso().slice(0, 10),
      source: cleanString(body.source, "manual"),
      finance_reference: textOrNull(body.financeReference),
      evidence: objectValue(body.evidence),
      approval_status: cleanString(body.approvalStatus, "not_required"),
      created_by: actorId,
    }) }
  }

  if (operation === "create-performance-period") {
    requireCampaign()
    return { performancePeriod: await insertOne(supabase, TABLES.performancePeriods, {
      campaign_id: campaignId,
      label: cleanString(body.label, "Période campagne"),
      starts_at: textOrNull(body.startsAt) || nowIso(),
      ends_at: textOrNull(body.endsAt),
      status: "active",
      targets: objectValue(body.targets),
      created_by: actorId,
    }) }
  }

  if (operation === "close-performance-period") {
    const periodId = cleanString(body.periodId)
    return { performancePeriod: await rpcOne(supabase, "revenue_close_campaign_performance_period", { p_period_id: periodId, p_actor_id: actorId }) }
  }

  if (operation === "create-experiment") {
    requireCampaign()
    const experiment = await insertOne(supabase, TABLES.experiments, {
      campaign_id: campaignId,
      name: cleanString(body.name, "Expérience campagne"),
      hypothesis: cleanString(body.hypothesis),
      primary_metric: cleanString(body.primaryMetric, "positive_reply_rate"),
      secondary_metrics: cleanArray(body.secondaryMetrics),
      allocation: objectValue(body.allocation),
      minimum_sample_size: Math.max(1, cleanNumber(body.minimumSampleSize, 100)),
      status: "draft",
      starts_at: textOrNull(body.startsAt),
      ends_at: textOrNull(body.endsAt),
      created_by: actorId,
    })
    return { experiment }
  }

  if (operation === "create-recovery-plan") {
    requireCampaign()
    const recovery = await insertOne(supabase, TABLES.recoveryPlans, {
      campaign_id: campaignId,
      root_cause: cleanString(body.rootCause),
      impact: cleanString(body.impact),
      containment: cleanString(body.containment),
      corrective_actions: objectValue(body.correctiveActions),
      owner: cleanString(body.owner, actorName),
      deadline: textOrNull(body.deadline),
      restart_criteria: cleanString(body.restartCriteria),
      status: "active",
      created_by: actorId,
    })
    await updateOne(supabase, "revenue_campaigns", campaignId, { status: "recovery", risk_status: "at_risk" })
    return { recoveryPlan: recovery }
  }

  if (operation === "complete-recovery-checkpoint") {
    const checkpointId = cleanString(body.checkpointId)
    if (!checkpointId) throw new Error("Checkpoint requis.")
    return { checkpoint: await updateOne(supabase, TABLES.recoveryCheckpoints, checkpointId, { status: "completed", result: cleanString(body.result), evidence: objectValue(body.evidence), completed_by: actorId, completed_at: nowIso() }) }
  }

  if (operation === "record-evidence") {
    requireCampaign()
    return { evidence: await insertOne(supabase, TABLES.evidence, {
      campaign_id: campaignId,
      evidence_type: cleanString(body.evidenceType, "operational"),
      title: cleanString(body.title, "Preuve campagne"),
      reference: cleanString(body.reference),
      url: textOrNull(body.url),
      payload: objectValue(body.payload),
      created_by: actorId,
    }) }
  }

  throw new Error(`Commande campagne inconnue : ${operation}`)
}
