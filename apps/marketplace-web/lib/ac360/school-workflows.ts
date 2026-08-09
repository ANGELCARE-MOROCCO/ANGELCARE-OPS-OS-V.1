import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'
import { buildAc360IdempotencyKey, runAc360WiredAction } from './action-wiring'
import { resolveAc360SchoolOpsContext } from './school-ops'

export type Ac360SchoolWorkflowPayload = Record<string, unknown>

type WorkflowWiringKey =
  | 'ac360.school_workflows.task_board.upsert'
  | 'ac360.school_workflows.task.status_update'
  | 'ac360.school_workflows.task.comment'
  | 'ac360.school_workflows.task.checklist'
  | 'ac360.school_workflows.task.recurring_rule'
  | 'ac360.school_workflows.task.recurring_generate'
  | 'ac360.school_workflows.approval_policy.upsert'
  | 'ac360.school_workflows.approval.request'
  | 'ac360.school_workflows.approval.decide'
  | 'ac360.school_workflows.template.upsert'
  | 'ac360.school_workflows.instance.start'
  | 'ac360.school_workflows.step.advance'
  | 'ac360.school_workflows.event.record'
  | 'ac360.school_workflows.ticket.open'
  | 'ac360.school_workflows.ticket.resolve'
  | 'ac360.school_workflows.operations.reconcile'
  | 'ac360.school_workflows.operations.alert.resolve'

function cleanMetadata(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown, fallback = '') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function num(value: unknown, fallback = 1) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function currentActorId() {
  const user = await getCurrentUser().catch(() => null) as any
  return user?.id || null
}

async function executeWorkflowRpc(
  wiringKey: WorkflowWiringKey,
  body: Ac360SchoolWorkflowPayload,
  rpcName: string,
  rpcArgs: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
  quantity = 1,
) {
  const resolved = await resolveAc360SchoolOpsContext(String(body.orgId || body.org_id || '') || undefined)
  if (!resolved.ok) return resolved

  const idempotencySeed = body.idempotencyKey || body.idempotency_key || `${resolved.orgId}:${wiringKey}:${body.taskId || body.task_id || body.boardKey || body.board_key || body.requestCode || body.request_code || body.workflowInstanceId || body.workflow_instance_id || body.ticketId || body.ticket_id || body.alertId || body.alert_id || Date.now()}`

  const guarded = await runAc360WiredAction(wiringKey, async () => {
    const db = await createClient()
    const { data, error } = await db.rpc(rpcName, { ...rpcArgs, p_org_id: resolved.orgId } as any)
    if (error) return { ok: false, status: 500, error: error.message || `AC360 workflows RPC failed: ${rpcName}` }
    return { ok: true, status: 200, data }
  }, {
    orgId: resolved.orgId,
    quantity: Math.max(1, Math.ceil(quantity || 1)),
    idempotencyKey: buildAc360IdempotencyKey(wiringKey, idempotencySeed),
    metadata: {
      source: 'lib.ac360.school-workflows',
      phase: 'phase_2g_tasks_approvals_workflows_operations',
      uiBuildAllowed: false,
      rpcName,
      ...metadata,
    },
  })

  if (!guarded.ok) {
    return { ok: false, status: 402, error: guarded.error || guarded.guard.reason || 'AC360 guard blocked task/approval/workflow/operations action.', ac360: { guard: guarded.guard, blocked: true } }
  }

  return { ...(guarded.data as any), ac360: { guard: guarded.guard, usage: guarded.usage } }
}

export async function getAc360SchoolWorkflowsDashboard(orgId?: string, campusId?: string | null, asOfDate?: string | null) {
  const resolved = await resolveAc360SchoolOpsContext(orgId)
  if (!resolved.ok) return resolved
  const db = await createClient()
  const { data, error } = await db.rpc('ac360_school_workflows_dashboard', {
    p_org_id: resolved.orgId,
    p_campus_id: campusId || null,
    p_as_of_date: asOfDate || null,
  } as any)
  if (error) return { ok: false as const, status: 500, error: error.message || 'Unable to load AC360 workflows dashboard.' }
  return { ok: true as const, context: resolved.context, dashboard: data }
}

export async function upsertAc360TaskBoard(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.task_board.upsert', body, 'ac360_school_upsert_task_board', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_board_key: body.boardKey || body.board_key || null,
    p_label: body.label || body.title || null,
    p_department: body.department || null,
    p_board_type: text(body.boardType || body.board_type, 'operations'),
    p_status: text(body.status, 'active'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'task_board.upsert' })
}

export async function updateAc360TaskStatus(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.task.status_update', body, 'ac360_school_update_task_status', {
    p_task_id: body.taskId || body.task_id,
    p_to_status: body.toStatus || body.to_status || body.status,
    p_reason: body.reason || body.blockedReason || body.blocked_reason || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'task.status_update' })
}

export async function addAc360TaskComment(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.task.comment', body, 'ac360_school_add_task_comment', {
    p_task_id: body.taskId || body.task_id,
    p_body: body.body || body.comment || body.note || '',
    p_comment_type: text(body.commentType || body.comment_type, 'note'),
    p_visibility: text(body.visibility, 'internal'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'task.comment' })
}

export async function upsertAc360TaskChecklistItem(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.task.checklist', body, 'ac360_school_upsert_task_checklist_item', {
    p_task_id: body.taskId || body.task_id,
    p_item_key: body.itemKey || body.item_key || null,
    p_label: body.label || body.title || null,
    p_status: text(body.status, 'open'),
    p_position: num(body.position, 100),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'task.checklist' })
}

export async function createAc360RecurringTaskRule(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.task.recurring_rule', body, 'ac360_school_create_recurring_task_rule', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_rule_key: body.ruleKey || body.rule_key || null,
    p_label: body.label || body.title || null,
    p_department: body.department || null,
    p_cadence: text(body.cadence, 'weekly'),
    p_next_run_on: body.nextRunOn || body.next_run_on || null,
    p_task_template: cleanMetadata(body.taskTemplate || body.task_template || body.template || {}),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'task.recurring_rule' }, 1)
}

export async function generateAc360RecurringTasks(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.task.recurring_generate', body, 'ac360_school_generate_recurring_tasks', {
    p_rule_id: body.ruleId || body.rule_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'task.recurring_generate' }, num(body.quantity || body.expectedCount || body.expected_count, 1))
}

export async function upsertAc360ApprovalPolicy(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  const roles = Array.isArray(body.approverRoleKeys || body.approver_role_keys) ? (body.approverRoleKeys || body.approver_role_keys) as string[] : []
  return executeWorkflowRpc('ac360.school_workflows.approval_policy.upsert', body, 'ac360_school_upsert_approval_policy', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_policy_key: body.policyKey || body.policy_key || null,
    p_label: body.label || body.title || null,
    p_approval_type: text(body.approvalType || body.approval_type, 'generic'),
    p_applies_to_entity_type: body.appliesToEntityType || body.applies_to_entity_type || null,
    p_min_approvals: num(body.minApprovals || body.min_approvals, 1),
    p_approver_role_keys: roles,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'approval_policy.upsert' })
}

export async function requestAc360Approval(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.approval.request', body, 'ac360_school_request_approval', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_policy_key: body.policyKey || body.policy_key || null,
    p_request_code: body.requestCode || body.request_code || null,
    p_approval_type: text(body.approvalType || body.approval_type, 'generic'),
    p_related_entity_type: body.relatedEntityType || body.related_entity_type || null,
    p_related_entity_id: body.relatedEntityId || body.related_entity_id || null,
    p_title: body.title || body.label || null,
    p_request_note: body.requestNote || body.request_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'approval.request' })
}

export async function decideAc360Approval(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.approval.decide', body, 'ac360_school_decide_approval', {
    p_approval_request_id: body.approvalRequestId || body.approval_request_id || body.requestId || body.request_id,
    p_decision: body.decision || body.status,
    p_decision_note: body.decisionNote || body.decision_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'approval.decide' })
}

export async function upsertAc360WorkflowTemplate(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.template.upsert', body, 'ac360_school_upsert_workflow_template', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_template_key: body.templateKey || body.template_key || null,
    p_label: body.label || body.title || null,
    p_workflow_type: text(body.workflowType || body.workflow_type, 'operations'),
    p_steps_json: Array.isArray(body.steps) ? body.steps : (body.stepsJson || body.steps_json || []),
    p_status: text(body.status, 'draft'),
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'workflow_template.upsert' })
}

export async function startAc360WorkflowInstance(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.instance.start', body, 'ac360_school_start_workflow_instance', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_template_key: body.templateKey || body.template_key || null,
    p_instance_code: body.instanceCode || body.instance_code || null,
    p_workflow_type: text(body.workflowType || body.workflow_type, 'operations'),
    p_related_entity_type: body.relatedEntityType || body.related_entity_type || null,
    p_related_entity_id: body.relatedEntityId || body.related_entity_id || null,
    p_title: body.title || body.label || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'workflow_instance.start' }, num(body.stepCount || body.step_count, 1))
}

export async function advanceAc360WorkflowStep(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.step.advance', body, 'ac360_school_advance_workflow_step', {
    p_workflow_instance_id: body.workflowInstanceId || body.workflow_instance_id,
    p_step_key: body.stepKey || body.step_key,
    p_status: text(body.status, 'completed'),
    p_message: body.message || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'workflow_step.advance' })
}

export async function recordAc360WorkflowEvent(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.event.record', body, 'ac360_school_record_workflow_event', {
    p_workflow_instance_id: body.workflowInstanceId || body.workflow_instance_id || null,
    p_workflow_step_id: body.workflowStepId || body.workflow_step_id || null,
    p_event_key: body.eventKey || body.event_key || 'workflow.event',
    p_event_type: text(body.eventType || body.event_type, 'status_change'),
    p_message: body.message || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'workflow_event.record' })
}

export async function openAc360OperationTicket(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.ticket.open', body, 'ac360_school_open_operation_ticket', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_ticket_code: body.ticketCode || body.ticket_code || null,
    p_ticket_type: text(body.ticketType || body.ticket_type, 'operations'),
    p_title: body.title || body.label || null,
    p_description: body.description || null,
    p_severity: text(body.severity, 'medium'),
    p_related_entity_type: body.relatedEntityType || body.related_entity_type || null,
    p_related_entity_id: body.relatedEntityId || body.related_entity_id || null,
    p_assigned_staff_id: body.assignedStaffId || body.assigned_staff_id || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'operations_ticket.open' })
}

export async function resolveAc360OperationTicket(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.ticket.resolve', body, 'ac360_school_resolve_operation_ticket', {
    p_ticket_id: body.ticketId || body.ticket_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'operations_ticket.resolve' })
}

export async function reconcileAc360Operations(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.operations.reconcile', body, 'ac360_school_reconcile_operations', {
    p_campus_id: body.campusId || body.campus_id || null,
    p_source_key: body.sourceKey || body.source_key || 'manual_reconcile',
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'operations.reconcile' })
}

export async function resolveAc360OperationsAlert(body: Ac360SchoolWorkflowPayload) {
  const actorId = await currentActorId()
  return executeWorkflowRpc('ac360.school_workflows.operations.alert.resolve', body, 'ac360_school_resolve_operations_alert', {
    p_alert_id: body.alertId || body.alert_id,
    p_resolution_note: body.resolutionNote || body.resolution_note || body.note || null,
    p_actor_app_user_id: actorId,
    p_metadata: cleanMetadata(body.metadata || body.metadata_json),
  }, { workflowAction: 'operations_alert.resolve' })
}
