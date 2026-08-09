import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolOnboardingPayload = Record<string, unknown>

type OnboardingWiringKey =
  | 'ac360.school_onboarding.migration_project.create'
  | 'ac360.school_onboarding.migration_source.upsert'
  | 'ac360.school_onboarding.migration_batch.create'
  | 'ac360.school_onboarding.migration_record.process'
  | 'ac360.school_onboarding.validation_finding.record'
  | 'ac360.school_onboarding.project.open'
  | 'ac360.school_onboarding.step.update'
  | 'ac360.school_onboarding.setup_checklist.upsert'
  | 'ac360.school_onboarding.setup_item.complete'
  | 'ac360.school_onboarding.success_account.upsert'
  | 'ac360.school_onboarding.success_touchpoint.record'
  | 'ac360.school_onboarding.health_score.compute'
  | 'ac360.school_onboarding.success_playbook.upsert'
  | 'ac360.school_onboarding.reconcile'
  | 'ac360.school_onboarding.alert.resolve'

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

async function executeOnboardingRpc(
  wiringKey: OnboardingWiringKey,
  body: Ac360SchoolOnboardingPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idSeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.projectId || body.project_id || body.migrationProjectId || body.migration_project_id || body.batchId || body.batch_id || body.recordId || body.record_id || body.onboardingProjectId || body.onboarding_project_id || body.stepId || body.step_id || body.checklistId || body.checklist_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey as any, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 onboarding/client success RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idSeed),
    metadata: {
      source: 'lib.ac360.school-onboarding',
      phase: 'phase_2q_migration_onboarding_client_success',
      uiBuildAllowed: false,
      archiveNotDelete: true,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked onboarding/client success action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolOnboardingDashboard(orgId?: string, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_onboarding_success_dashboard', { p_org_id: resolved.orgId, p_as_of_date: asOfDate || null } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 onboarding/client success dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function createAc360MigrationProject(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.migration_project.create', body, 'ac360_school_create_migration_project', {
    p_project_key: body.projectKey || body.project_key || null,
    p_label: body.label || null,
    p_source_system: body.sourceSystem || body.source_system || null,
    p_import_scope: text(body.importScope || body.import_scope, 'full_school_setup'),
    p_priority: text(body.priority, 'normal'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'migration_project.create' })
}

export async function upsertAc360MigrationSource(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.migration_source.upsert', body, 'ac360_school_upsert_migration_source', {
    p_source_id: body.sourceId || body.source_id || null,
    p_migration_project_id: body.migrationProjectId || body.migration_project_id || null,
    p_source_key: body.sourceKey || body.source_key || null,
    p_source_type: text(body.sourceType || body.source_type, 'excel'),
    p_label: body.label || null,
    p_file_name: body.fileName || body.file_name || null,
    p_storage_path: body.storagePath || body.storage_path || null,
    p_mapping_json: body.mappingJson || body.mapping_json || body.mapping || {},
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'migration_source.upsert' })
}

export async function createAc360MigrationBatch(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.migration_batch.create', body, 'ac360_school_create_migration_batch', {
    p_migration_project_id: body.migrationProjectId || body.migration_project_id || null,
    p_migration_source_id: body.migrationSourceId || body.migration_source_id || null,
    p_batch_key: body.batchKey || body.batch_key || null,
    p_entity_type: text(body.entityType || body.entity_type, 'students'),
    p_total_records: body.totalRecords || body.total_records || 0,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'migration_batch.create' })
}

export async function processAc360MigrationRecord(body: Ac360SchoolOnboardingPayload) {
  return executeOnboardingRpc('ac360.school_onboarding.migration_record.process', body, 'ac360_school_process_migration_record', {
    p_migration_batch_id: body.migrationBatchId || body.migration_batch_id,
    p_source_row_number: body.sourceRowNumber || body.source_row_number || null,
    p_source_identifier: body.sourceIdentifier || body.source_identifier || null,
    p_target_entity_type: body.targetEntityType || body.target_entity_type || null,
    p_target_entity_id: body.targetEntityId || body.target_entity_id || null,
    p_status: text(body.status, 'processed'),
    p_raw_json: body.rawJson || body.raw_json || body.raw || {},
    p_mapped_json: body.mappedJson || body.mapped_json || body.mapped || {},
    p_error_json: body.errorJson || body.error_json || body.errors || {},
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'migration_record.process' })
}

export async function recordAc360ValidationFinding(body: Ac360SchoolOnboardingPayload) {
  return executeOnboardingRpc('ac360.school_onboarding.validation_finding.record', body, 'ac360_school_record_data_validation_finding', {
    p_migration_project_id: body.migrationProjectId || body.migration_project_id || null,
    p_migration_batch_id: body.migrationBatchId || body.migration_batch_id || null,
    p_migration_record_id: body.migrationRecordId || body.migration_record_id || null,
    p_finding_key: body.findingKey || body.finding_key || null,
    p_severity: text(body.severity, 'warning'),
    p_entity_type: body.entityType || body.entity_type || null,
    p_field_key: body.fieldKey || body.field_key || null,
    p_message: body.message || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'validation_finding.record' })
}

export async function openAc360OnboardingProject(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.project.open', body, 'ac360_school_open_onboarding_project', {
    p_onboarding_key: body.onboardingKey || body.onboarding_key || null,
    p_label: body.label || null,
    p_migration_project_id: body.migrationProjectId || body.migration_project_id || null,
    p_target_go_live_date: body.targetGoLiveDate || body.target_go_live_date || null,
    p_owner_name: body.ownerName || body.owner_name || null,
    p_owner_email: body.ownerEmail || body.owner_email || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'project.open' })
}

export async function updateAc360OnboardingStep(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.step.update', body, 'ac360_school_update_onboarding_step', {
    p_step_id: body.stepId || body.step_id,
    p_status: text(body.status, 'completed'),
    p_actor_app_user_id: actorId,
    p_blocker_reason: body.blockerReason || body.blocker_reason || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'step.update' })
}

export async function upsertAc360SetupChecklist(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.setup_checklist.upsert', body, 'ac360_school_upsert_setup_checklist', {
    p_checklist_id: body.checklistId || body.checklist_id || null,
    p_onboarding_project_id: body.onboardingProjectId || body.onboarding_project_id || null,
    p_checklist_key: body.checklistKey || body.checklist_key || null,
    p_label: body.label || null,
    p_checklist_type: text(body.checklistType || body.checklist_type, 'implementation'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'setup_checklist.upsert' })
}

export async function completeAc360SetupItem(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.setup_item.complete', body, 'ac360_school_complete_setup_item', {
    p_checklist_id: body.checklistId || body.checklist_id,
    p_item_key: body.itemKey || body.item_key,
    p_label: body.label || null,
    p_status: text(body.status, 'completed'),
    p_actor_app_user_id: actorId,
    p_notes: body.notes || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'setup_item.complete' })
}

export async function upsertAc360SuccessAccount(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.success_account.upsert', body, 'ac360_school_upsert_success_account', {
    p_success_tier: text(body.successTier || body.success_tier, 'standard'),
    p_lifecycle_stage: text(body.lifecycleStage || body.lifecycle_stage, 'onboarding'),
    p_health_status: text(body.healthStatus || body.health_status, 'unknown'),
    p_assigned_success_manager: body.assignedSuccessManager || body.assigned_success_manager || null,
    p_next_review_date: body.nextReviewDate || body.next_review_date || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'success_account.upsert' })
}

export async function recordAc360SuccessTouchpoint(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.success_touchpoint.record', body, 'ac360_school_record_success_touchpoint', {
    p_touchpoint_type: text(body.touchpointType || body.touchpoint_type, 'check_in'),
    p_channel: text(body.channel, 'internal'),
    p_summary: body.summary || null,
    p_outcome: text(body.outcome, 'recorded'),
    p_next_action: body.nextAction || body.next_action || null,
    p_next_action_due_at: body.nextActionDueAt || body.next_action_due_at || null,
    p_sentiment: text(body.sentiment, 'neutral'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'success_touchpoint.record' })
}

export async function computeAc360SuccessHealthScore(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.health_score.compute', body, 'ac360_school_compute_success_health_score', {
    p_score_date: body.scoreDate || body.score_date || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'health_score.compute' })
}

export async function upsertAc360SuccessPlaybook(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.success_playbook.upsert', body, 'ac360_school_upsert_success_playbook', {
    p_playbook_key: body.playbookKey || body.playbook_key || null,
    p_label: body.label || null,
    p_playbook_type: text(body.playbookType || body.playbook_type, 'onboarding'),
    p_trigger_json: body.triggerJson || body.trigger_json || body.trigger || {},
    p_steps_json: body.stepsJson || body.steps_json || body.steps || [],
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'success_playbook.upsert' })
}

export async function reconcileAc360OnboardingSuccess(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.reconcile', body, 'ac360_school_reconcile_onboarding_success', {
    p_as_of_date: body.asOfDate || body.as_of_date || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'reconcile' })
}

export async function resolveAc360OnboardingAlert(body: Ac360SchoolOnboardingPayload) {
  const actorId = await currentActorId()
  return executeOnboardingRpc('ac360.school_onboarding.alert.resolve', body, 'ac360_school_resolve_onboarding_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_actor_app_user_id: actorId,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { onboardingAction: 'alert.resolve' })
}
