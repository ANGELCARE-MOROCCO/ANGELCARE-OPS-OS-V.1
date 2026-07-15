import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolAutomationPayload = Record<string, unknown>

type AutomationWiringKey =
  | 'ac360.school_automation.ai_prompt.upsert'
  | 'ac360.school_automation.ai_job.queue'
  | 'ac360.school_automation.ai_job.complete'
  | 'ac360.school_automation.ai_job.event'
  | 'ac360.school_automation.blueprint.upsert'
  | 'ac360.school_automation.rule.upsert'
  | 'ac360.school_automation.run.trigger'
  | 'ac360.school_automation.event.record'
  | 'ac360.school_automation.scheduled_job.upsert'
  | 'ac360.school_automation.scheduled_job.run'
  | 'ac360.school_automation.smart_alert_rule.upsert'
  | 'ac360.school_automation.smart_alert.emit'
  | 'ac360.school_automation.smart_alert.resolve'
  | 'ac360.school_automation.reconcile'
  | 'ac360.school_automation.alert.resolve'

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeAutomationRpc(
  wiringKey: AutomationWiringKey,
  body: Ac360SchoolAutomationPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.promptId || body.prompt_id || body.aiJobId || body.ai_job_id || body.ruleId || body.rule_id || body.automationRunId || body.automation_run_id || body.scheduledJobId || body.scheduled_job_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 AI/Automation RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.school-automation',
      phase: 'phase_2n_ai_automation_smart_alerts_scheduled_jobs',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked AI/Automation action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolAutomationDashboard(orgId?: string, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_ai_automation_dashboard', {
    p_org_id: resolved.orgId,
    p_as_of_date: asOfDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 AI/Automation dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360AiPromptTemplate(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  return executeAutomationRpc('ac360.school_automation.ai_prompt.upsert', body, 'ac360_school_upsert_ai_prompt_template', {
    p_template_id: body.templateId || body.template_id || null,
    p_prompt_key: body.promptKey || body.prompt_key || null,
    p_label: body.label || body.title || null,
    p_prompt_type: text(body.promptType || body.prompt_type, 'message'),
    p_target_module: text(body.targetModule || body.target_module, 'general'),
    p_language: text(body.language, 'fr'),
    p_system_prompt: body.systemPrompt || body.system_prompt || null,
    p_user_prompt_template: body.userPromptTemplate || body.user_prompt_template || body.template || null,
    p_variables_json: body.variablesJson || body.variables_json || body.variables || [],
    p_safety_json: body.safetyJson || body.safety_json || {},
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'ai_prompt.upsert' })
}

export async function queueAc360AiJob(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  const cost = num(body.estimatedCreditCost || body.estimated_credit_cost || body.creditCost || body.credit_cost, 10)
  return executeAutomationRpc('ac360.school_automation.ai_job.queue', body, 'ac360_school_queue_ai_job', {
    p_prompt_template_id: body.promptTemplateId || body.prompt_template_id || null,
    p_job_key: body.jobKey || body.job_key || null,
    p_job_type: text(body.jobType || body.job_type, 'message'),
    p_target_module: text(body.targetModule || body.target_module, 'general'),
    p_target_entity_type: body.targetEntityType || body.target_entity_type || null,
    p_target_entity_id: body.targetEntityId || body.target_entity_id || null,
    p_input_json: body.inputJson || body.input_json || body.input || {},
    p_requested_language: text(body.requestedLanguage || body.requested_language || body.language, 'fr'),
    p_estimated_credit_cost: cost,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'ai_job.queue' }, cost)
}

export async function completeAc360AiJob(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  return executeAutomationRpc('ac360.school_automation.ai_job.complete', body, 'ac360_school_complete_ai_job', {
    p_ai_job_id: body.aiJobId || body.ai_job_id || body.jobId || body.job_id,
    p_status: text(body.status, 'completed'),
    p_output_json: body.outputJson || body.output_json || body.output || {},
    p_actual_credit_cost: body.actualCreditCost == null && body.actual_credit_cost == null ? null : num(body.actualCreditCost || body.actual_credit_cost),
    p_failed_reason: body.failedReason || body.failed_reason || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'ai_job.complete' })
}

export async function recordAc360AiJobEvent(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  return executeAutomationRpc('ac360.school_automation.ai_job.event', body, 'ac360_school_record_ai_job_event', {
    p_ai_job_id: body.aiJobId || body.ai_job_id || body.jobId || body.job_id,
    p_event_type: text(body.eventType || body.event_type, 'event'),
    p_severity: text(body.severity, 'info'),
    p_message: body.message || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'ai_job.event' })
}

export async function upsertAc360AutomationBlueprint(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  return executeAutomationRpc('ac360.school_automation.blueprint.upsert', body, 'ac360_school_upsert_automation_blueprint', {
    p_blueprint_id: body.blueprintId || body.blueprint_id || null,
    p_blueprint_key: body.blueprintKey || body.blueprint_key || null,
    p_label: body.label || body.title || null,
    p_blueprint_type: text(body.blueprintType || body.blueprint_type, 'workflow'),
    p_target_module: text(body.targetModule || body.target_module, 'general'),
    p_trigger_schema_json: body.triggerSchemaJson || body.trigger_schema_json || {},
    p_steps_json: body.stepsJson || body.steps_json || body.steps || [],
    p_default_conditions_json: body.defaultConditionsJson || body.default_conditions_json || {},
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'blueprint.upsert' })
}

export async function upsertAc360AutomationRule(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  return executeAutomationRpc('ac360.school_automation.rule.upsert', body, 'ac360_school_upsert_automation_rule', {
    p_rule_id: body.ruleId || body.rule_id || null,
    p_blueprint_id: body.blueprintId || body.blueprint_id || null,
    p_rule_key: body.ruleKey || body.rule_key || null,
    p_label: body.label || body.title || null,
    p_target_module: text(body.targetModule || body.target_module, 'general'),
    p_trigger_event: text(body.triggerEvent || body.trigger_event, 'manual'),
    p_condition_json: body.conditionJson || body.condition_json || body.conditions || {},
    p_action_json: body.actionJson || body.action_json || body.actions || {},
    p_credit_budget: num(body.creditBudget || body.credit_budget, 1),
    p_priority: text(body.priority, 'medium'),
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'rule.upsert' })
}

export async function triggerAc360AutomationRun(body: Ac360SchoolAutomationPayload) {
  return executeAutomationRpc('ac360.school_automation.run.trigger', body, 'ac360_school_trigger_automation_run', {
    p_rule_id: body.ruleId || body.rule_id || null,
    p_run_key: body.runKey || body.run_key || null,
    p_trigger_event: text(body.triggerEvent || body.trigger_event, 'manual'),
    p_target_module: text(body.targetModule || body.target_module, 'general'),
    p_target_entity_type: body.targetEntityType || body.target_entity_type || null,
    p_target_entity_id: body.targetEntityId || body.target_entity_id || null,
    p_input_json: body.inputJson || body.input_json || body.input || {},
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'run.trigger' }, num(body.creditBudget || body.credit_budget, 1))
}

export async function recordAc360AutomationEvent(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  return executeAutomationRpc('ac360.school_automation.event.record', body, 'ac360_school_record_automation_event', {
    p_automation_run_id: body.automationRunId || body.automation_run_id || body.runId || body.run_id,
    p_event_type: text(body.eventType || body.event_type, 'event'),
    p_step_key: body.stepKey || body.step_key || null,
    p_severity: text(body.severity, 'info'),
    p_message: body.message || body.note || null,
    p_payload_json: body.payloadJson || body.payload_json || body.payload || {},
    p_actor_app_user_id: actorId,
  }, { automationAction: 'event.record' })
}

export async function upsertAc360ScheduledJob(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  return executeAutomationRpc('ac360.school_automation.scheduled_job.upsert', body, 'ac360_school_upsert_scheduled_job', {
    p_scheduled_job_id: body.scheduledJobId || body.scheduled_job_id || null,
    p_schedule_key: body.scheduleKey || body.schedule_key || null,
    p_label: body.label || body.title || null,
    p_job_type: text(body.jobType || body.job_type, 'reconcile'),
    p_target_module: text(body.targetModule || body.target_module, 'general'),
    p_cron_expression: body.cronExpression || body.cron_expression || null,
    p_run_interval: text(body.runInterval || body.run_interval, 'daily'),
    p_payload_json: body.payloadJson || body.payload_json || body.payload || {},
    p_next_run_at: body.nextRunAt || body.next_run_at || null,
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'scheduled_job.upsert' })
}

export async function runAc360ScheduledJob(body: Ac360SchoolAutomationPayload) {
  return executeAutomationRpc('ac360.school_automation.scheduled_job.run', body, 'ac360_school_run_scheduled_job', {
    p_scheduled_job_id: body.scheduledJobId || body.scheduled_job_id,
    p_run_key: body.runKey || body.run_key || null,
    p_status: text(body.status, 'completed'),
    p_result_json: body.resultJson || body.result_json || body.result || {},
    p_failed_reason: body.failedReason || body.failed_reason || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'scheduled_job.run' })
}

export async function upsertAc360SmartAlertRule(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  return executeAutomationRpc('ac360.school_automation.smart_alert_rule.upsert', body, 'ac360_school_upsert_smart_alert_rule', {
    p_rule_id: body.ruleId || body.rule_id || null,
    p_rule_key: body.ruleKey || body.rule_key || null,
    p_label: body.label || body.title || null,
    p_target_module: text(body.targetModule || body.target_module, 'general'),
    p_alert_type: text(body.alertType || body.alert_type, 'operational'),
    p_severity: text(body.severity, 'warning'),
    p_condition_json: body.conditionJson || body.condition_json || body.conditions || {},
    p_recommendation_json: body.recommendationJson || body.recommendation_json || body.recommendations || {},
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'smart_alert_rule.upsert' })
}

export async function emitAc360SmartAlert(body: Ac360SchoolAutomationPayload) {
  return executeAutomationRpc('ac360.school_automation.smart_alert.emit', body, 'ac360_school_emit_smart_alert', {
    p_rule_id: body.ruleId || body.rule_id || null,
    p_alert_key: body.alertKey || body.alert_key || null,
    p_target_module: text(body.targetModule || body.target_module, 'general'),
    p_alert_type: text(body.alertType || body.alert_type, 'operational'),
    p_severity: text(body.severity, 'warning'),
    p_title: body.title || null,
    p_message: body.message || null,
    p_target_entity_type: body.targetEntityType || body.target_entity_type || null,
    p_target_entity_id: body.targetEntityId || body.target_entity_id || null,
    p_recommendation_json: body.recommendationJson || body.recommendation_json || body.recommendations || {},
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'smart_alert.emit' })
}

export async function resolveAc360SmartAlert(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  return executeAutomationRpc('ac360.school_automation.smart_alert.resolve', body, 'ac360_school_resolve_smart_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_actor_app_user_id: actorId,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'smart_alert.resolve' })
}

export async function reconcileAc360AiAutomation(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  return executeAutomationRpc('ac360.school_automation.reconcile', body, 'ac360_school_ai_automation_reconcile', {
    p_as_of_date: body.asOfDate || body.as_of_date || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'reconcile' })
}

export async function resolveAc360AiAutomationAlert(body: Ac360SchoolAutomationPayload) {
  const actorId = await currentActorId()
  return executeAutomationRpc('ac360.school_automation.alert.resolve', body, 'ac360_school_resolve_ai_automation_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_actor_app_user_id: actorId,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { automationAction: 'alert.resolve' })
}
