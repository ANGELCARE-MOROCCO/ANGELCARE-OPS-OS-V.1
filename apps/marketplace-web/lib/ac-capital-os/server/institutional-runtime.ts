import { createHash, randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { JsonRecord } from "./free-provider-types";

export type InstitutionalActor = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
};

type SupabaseAny = Awaited<ReturnType<typeof createServiceClient>>;

const now = () => new Date().toISOString();
const clean = (value: unknown) => String(value ?? "").trim();
const object = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const rows = (value: unknown): JsonRecord[] => Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
const actorName = (actor: InstitutionalActor) => clean(actor.email || actor.name || actor.id || "AC Capital operator");

type EntityContract = {
  table: string;
  workspace: string;
  title: string;
  titleField: string;
  allowedFields: string[];
};

const entityTables: Record<string, EntityContract> = {
  source: { table: "ac_capital_radar_sources", workspace: "radar", title: "Radar source", titleField: "title", allowedFields: ["title","verification_status","source_type","source_confidence","review_notes","lifecycle_status"] },
  opportunity: { table: "ac_capital_radar_opportunities", workspace: "radar", title: "Capital opportunity", titleField: "title", allowedFields: ["title","status","handoff_status","deadline","deadline_label","priority","lifecycle_status"] },
  funder: { table: "ac_capital_funders", workspace: "funders", title: "Funder", titleField: "name", allowedFields: ["name","relationship_status","relationship_temperature","strategic_priority","owner","next_action","next_action_due_date","lifecycle_status"] },
  qualification: { table: "ac_capital_qualification_dossiers", workspace: "qualification", title: "Qualification dossier", titleField: "title", allowedFields: ["title","decision_label","status","priority","recommended_owner","next_action","strategic_exception","lifecycle_status"] },
  case: { table: "ac_capital_cases", workspace: "cases", title: "Funding case", titleField: "case_title", allowedFields: ["case_title","status","priority","owner","next_action","founder_approval_status","coordinator_handover_status","lifecycle_status"] },
  document: { table: "ac_capital_data_room_documents", workspace: "data-room", title: "Proof document", titleField: "title", allowedFields: ["title","category","document_type","readiness_level","status","owner","approval_status","next_action","notes","lifecycle_status"] },
  pipeline: { table: "ac_capital_pipeline_records", workspace: "pipeline", title: "Pipeline record", titleField: "title", allowedFields: ["title","stage","status","owner","priority","probability_percent","deadline","next_action","next_action_due_date","risk_level","lifecycle_status"] },
  "coordinator-task": { table: "ac_capital_coordinator_tasks", workspace: "coordinator", title: "Coordinator mission", titleField: "task_title", allowedFields: ["task_title","task_type","priority","status","due_at","owner","human_action_required","risk_if_missed","next_step_after_completion","lifecycle_status"] },
  report: { table: "ac_capital_strategy_reports", workspace: "reports", title: "Executive report", titleField: "report_type", allowedFields: ["report_type","purpose","audience","readiness","approval_requirement","status","lifecycle_status"] },
  approval: { table: "ac_capital_universal_approvals", workspace: "approvals", title: "Universal approval", titleField: "approval_type", allowedFields: ["approval_type","decision_requested","risk_level","status","decision_note","lifecycle_status"] },
  artifact: { table: "ac_capital_artifacts", workspace: "artifacts", title: "Capital artifact", titleField: "title", allowedFields: ["title","status","approval_status","confidentiality","lifecycle_status"] },
};

function entityContract(entityType: string) {
  const contract = entityTables[clean(entityType)];
  if (!contract) throw Object.assign(new Error(`AC_CAPITAL_UNSUPPORTED_ENTITY:${entityType}`), { status: 400 });
  return contract;
}

async function one(supabase: SupabaseAny, table: string, id: string) {
  const result = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) throw Object.assign(new Error(`AC_CAPITAL_RECORD_NOT_FOUND:${table}:${id}`), { status: 404 });
  return result.data as JsonRecord;
}

async function commandResult(supabase: SupabaseAny, input: {
  commandKey: string;
  workspaceKey: string;
  actor: InstitutionalActor;
  status: string;
  summary: string;
  created?: JsonRecord[];
  updated?: JsonRecord[];
  events?: JsonRecord[];
  warnings?: unknown[];
  errors?: unknown[];
  result?: JsonRecord;
  requestId?: string;
}) {
  const payload = {
    command_key: input.commandKey,
    workspace_key: input.workspaceKey,
    actor: actorName(input.actor),
    request_id: input.requestId || randomUUID(),
    status: input.status,
    summary: input.summary,
    records_created: input.created || [],
    records_updated: input.updated || [],
    events_emitted: input.events || [],
    warnings: input.warnings || [],
    errors: input.errors || [],
    result_snapshot: input.result || {},
    completed_at: now(),
  };
  const result = await supabase.from("ac_capital_command_results").insert(payload).select("*").single();
  if (result.error) throw result.error;
  return result.data as JsonRecord;
}

export async function createNotification(input: {
  notificationType: string;
  severity?: string;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  workspaceKey?: string;
  actionHref?: string;
  recipientRole?: string;
  recipientId?: string;
  deduplicationKey?: string;
  metadata?: JsonRecord;
}) {
  const supabase = await createServiceClient();
  const payload = {
    notification_type: input.notificationType,
    severity: input.severity || "info",
    title: input.title,
    message: input.message || null,
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    workspace_key: input.workspaceKey || null,
    action_href: input.actionHref || null,
    recipient_role: input.recipientRole || null,
    recipient_id: input.recipientId || null,
    deduplication_key: input.deduplicationKey || null,
    metadata: input.metadata || {},
    updated_at: now(),
  };
  const result = input.deduplicationKey
    ? await supabase.from("ac_capital_notifications").upsert(payload, { onConflict: "deduplication_key" }).select("*").single()
    : await supabase.from("ac_capital_notifications").insert(payload).select("*").single();
  if (result.error) throw result.error;
  return result.data as JsonRecord;
}

export async function acquireRuntimeLease(input: { leaseKey: string; holder: string; ttlSeconds?: number; metadata?: JsonRecord }) {
  const supabase = await createServiceClient();
  const ttl = Math.max(30, Math.min(3600, Number(input.ttlSeconds || 300)));
  const current = await supabase.from("ac_capital_runtime_leases").select("*").eq("lease_key", input.leaseKey).maybeSingle();
  if (current.error) throw current.error;
  const existing = current.data as JsonRecord | null;
  if (existing && new Date(clean(existing.expires_at)).getTime() > Date.now() && clean(existing.holder) !== input.holder) {
    return { acquired: false, lease: existing };
  }
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  const result = await supabase.from("ac_capital_runtime_leases").upsert({
    lease_key: input.leaseKey,
    holder: input.holder,
    acquired_at: now(),
    heartbeat_at: now(),
    expires_at: expiresAt,
    metadata: input.metadata || {},
  }, { onConflict: "lease_key" }).select("*").single();
  if (result.error) throw result.error;
  return { acquired: true, lease: result.data as JsonRecord };
}

export async function releaseRuntimeLease(leaseKey: string, holder: string) {
  const supabase = await createServiceClient();
  const result = await supabase.from("ac_capital_runtime_leases").delete().eq("lease_key", leaseKey).eq("holder", holder);
  if (result.error) throw result.error;
  return { released: true };
}

export async function evaluateStageGates(input: {
  entityType: string;
  entityId: string;
  workspaceKey: string;
  requestedStage: string;
  actor: InstitutionalActor;
}) {
  const supabase = await createServiceClient();
  const contract = entityContract(input.entityType);
  const entity = await one(supabase, contract.table, input.entityId);
  const gateRows = await supabase.from("ac_capital_stage_gates").select("*")
    .eq("workspace_key", input.workspaceKey).eq("to_stage", input.requestedStage).eq("active", true);
  if (gateRows.error) throw gateRows.error;
  const evaluations: JsonRecord[] = [];
  const blockers: JsonRecord[] = [];

  for (const gate of rows(gateRows.data)) {
    const rule = object(gate.rule);
    let passed = true;
    const reasons: string[] = [];
    for (const field of Array.isArray(rule.requires) ? rule.requires.map(String) : []) {
      if (!entity[field]) { passed = false; reasons.push(`Missing ${field}`); }
    }
    if (Number(rule.minimumReadiness || 0) > Number(entity.readiness_score || entity.total_readiness_score || 0)) {
      passed = false; reasons.push(`Readiness below ${rule.minimumReadiness}`);
    }
    if (Number(rule.minimumDocumentReadiness || 0) > Number(entity.document_readiness_score || entity.data_room_readiness_score || 0)) {
      passed = false; reasons.push(`Document readiness below ${rule.minimumDocumentReadiness}`);
    }
    if (rule.requiresApproval === true) {
      const approvalObjectType = input.entityType === "pipeline" ? "case" : input.entityType;
      const approvalObjectId = clean(entity.case_id || entity.id);
      let requiredVersion = String(entity.record_version || 1);

      if (input.entityType === "pipeline" && approvalObjectId) {
        const caseVersion = await supabase
          .from("ac_capital_cases")
          .select("record_version")
          .eq("id", approvalObjectId)
          .maybeSingle();
        if (caseVersion.error) throw caseVersion.error;
        requiredVersion = String(caseVersion.data?.record_version || 1);
      }

      const approval = await supabase
        .from("ac_capital_universal_approvals")
        .select("id,status,object_version,decided_at")
        .eq("object_type", approvalObjectType)
        .eq("object_id", approvalObjectId)
        .eq("object_version", requiredVersion)
        .eq("status", "approved")
        .order("decided_at", { ascending: false })
        .limit(1);
      if (approval.error || !approval.data?.length) {
        passed = false;
        reasons.push(`No approval for current version ${requiredVersion}`);
      }
    }
    if (rule.requiresSubmissionProof === true) {
      const proof = await supabase.from("ac_capital_submission_proofs").select("id").eq("pipeline_record_id", input.entityId).limit(1);
      if (proof.error || !proof.data?.length) { passed = false; reasons.push("Submission proof is missing"); }
    }
    const row = { gateKey: gate.gate_key, label: gate.label, passed, blocking: gate.blocking, reasons };
    evaluations.push(row);
    if (!passed && gate.blocking !== false) blockers.push(row);
  }

  const persisted = await supabase.from("ac_capital_stage_gate_evaluations").insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    workspace_key: input.workspaceKey,
    requested_stage: input.requestedStage,
    passed: blockers.length === 0,
    evaluated_gates: evaluations,
    blockers,
    evaluated_by: actorName(input.actor),
  }).select("*").single();
  if (persisted.error) throw persisted.error;
  return { passed: blockers.length === 0, evaluations, blockers, evaluation: persisted.data };
}

export async function searchInstitutionalRecords(input: {
  query?: string;
  entityType?: string;
  status?: string;
  limit?: number;
}) {
  const supabase = await createServiceClient();
  const query = clean(input.query);
  const status = clean(input.status);
  const limit = Math.max(1, Math.min(100, Number(input.limit || 40)));
  const types = clean(input.entityType) && clean(input.entityType) !== "all"
    ? [clean(input.entityType)]
    : Object.keys(entityTables);
  const resultRows: JsonRecord[] = [];
  const warnings: JsonRecord[] = [];

  for (const entityType of types) {
    const contract = entityTables[entityType];
    if (!contract) continue;
    let request = supabase.from(contract.table).select("*").order("updated_at", { ascending: false }).limit(limit);
    if (query) request = request.ilike(contract.titleField, `%${query.replaceAll("%", "")}%`);
    const result = await request;
    if (result.error) {
      warnings.push({ entityType, table: contract.table, error: result.error.message });
      continue;
    }
    for (const row of rows(result.data)) {
      const rowStatus = clean(row.lifecycle_status || row.status || row.approval_status || row.verification_status);
      if (status && status !== "all" && rowStatus.toLowerCase() !== status.toLowerCase()) continue;
      resultRows.push({
        ...row,
        entity_type: entityType,
        workspace_key: contract.workspace,
        display_title: clean(row[contract.titleField]) || `${contract.title} ${clean(row.id).slice(0, 8)}`,
        display_status: rowStatus || "active",
      });
    }
  }
  resultRows.sort((left, right) => new Date(clean(right.updated_at || right.created_at)).getTime() - new Date(clean(left.updated_at || left.created_at)).getTime());
  return { records: resultRows.slice(0, limit), warnings, generatedAt: now() };
}

export async function loadInstitutionalSnapshot(input: { workspaceKey?: string; entityType?: string; entityId?: string; actor?: InstitutionalActor }) {
  const supabase = await createServiceClient();
  const [notes, assignments, savedViews, notifications, versions, artifacts, deadLetters, schedules, commandResults] = await Promise.all([
    supabase.from("ac_capital_record_notes").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("ac_capital_record_assignments").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("ac_capital_saved_views").select("*").order("updated_at", { ascending: false }).limit(100),
    supabase.from("ac_capital_notifications").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("ac_capital_record_versions").select("*").order("created_at", { ascending: false }).limit(150),
    supabase.from("ac_capital_artifacts").select("*").order("updated_at", { ascending: false }).limit(100),
    supabase.from("ac_capital_dead_letters").select("*").order("last_failed_at", { ascending: false }).limit(100),
    supabase.from("ac_capital_agent_schedules").select("*").order("agent_key", { ascending: true }).limit(100),
    supabase.from("ac_capital_command_results").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  for (const result of [notes, assignments, savedViews, notifications, versions, artifacts, deadLetters, schedules, commandResults]) {
    if (result.error) throw result.error;
  }
  const entity = input.entityType && input.entityId ? await one(supabase, entityContract(input.entityType).table, input.entityId) : null;
  return {
    entity,
    notes: rows(notes.data),
    assignments: rows(assignments.data),
    savedViews: rows(savedViews.data),
    notifications: rows(notifications.data),
    versions: rows(versions.data),
    artifacts: rows(artifacts.data),
    deadLetters: rows(deadLetters.data),
    schedules: rows(schedules.data),
    commandResults: rows(commandResults.data),
    generatedAt: now(),
  };
}

export async function executeInstitutionalAction(action: string, payload: JsonRecord, actor: InstitutionalActor) {
  const supabase = await createServiceClient();
  const requestId = randomUUID();
  const entityType = clean(payload.entityType);
  const entityId = clean(payload.entityId);
  const contract = entityType ? entityContract(entityType) : null;

  if (action === "add-note") {
    if (!contract || !entityId || !clean(payload.body)) throw Object.assign(new Error("ENTITY_AND_NOTE_REQUIRED"), { status: 400 });
    await one(supabase, contract.table, entityId);
    const result = await supabase.from("ac_capital_record_notes").insert({
      entity_type: entityType, entity_id: entityId, note_type: clean(payload.noteType || "internal"),
      body: clean(payload.body), visibility: clean(payload.visibility || "internal"), created_by: actorName(actor),
    }).select("*").single();
    if (result.error) throw result.error;
    const command = await commandResult(supabase, { commandKey: action, workspaceKey: contract.workspace, actor, status: "completed", summary: "Internal note added.", created: [result.data as JsonRecord], result: { note: result.data as JsonRecord }, requestId });
    return { note: result.data, command };
  }

  if (action === "assign") {
    if (!contract || !entityId || !clean(payload.assigneeName || payload.assigneeId)) throw Object.assign(new Error("ENTITY_AND_ASSIGNEE_REQUIRED"), { status: 400 });
    await one(supabase, contract.table, entityId);
    await supabase.from("ac_capital_record_assignments").update({ status: "superseded", updated_at: now() })
      .eq("entity_type", entityType).eq("entity_id", entityId).eq("assignment_type", clean(payload.assignmentType || "owner")).eq("status", "active");
    const result = await supabase.from("ac_capital_record_assignments").insert({
      entity_type: entityType, entity_id: entityId, assignment_type: clean(payload.assignmentType || "owner"),
      assignee_id: clean(payload.assigneeId) || null, assignee_name: clean(payload.assigneeName) || null,
      due_at: clean(payload.dueAt) || null, assigned_by: actorName(actor), reason: clean(payload.reason) || null,
    }).select("*").single();
    if (result.error) throw result.error;
    const ownerColumn = ["source","opportunity","funder","qualification","case","document","pipeline","coordinator-task"].includes(entityType) ? "owner" : null;
    let updated: JsonRecord | null = null;
    if (ownerColumn) {
      const update = await supabase.from(contract.table).update({ owner: clean(payload.assigneeName || payload.assigneeId), updated_at: now() }).eq("id", entityId).select("*").single();
      if (!update.error) updated = update.data as JsonRecord;
    }
    const command = await commandResult(supabase, { commandKey: action, workspaceKey: contract.workspace, actor, status: "completed", summary: "Record assigned.", created: [result.data as JsonRecord], updated: updated ? [updated] : [], result: { assignment: result.data as JsonRecord, entity: updated || {} }, requestId });
    return { assignment: result.data, entity: updated, command };
  }

  if (["archive","restore","cancel","reopen"].includes(action)) {
    if (!contract || !entityId) throw Object.assign(new Error("ENTITY_REQUIRED"), { status: 400 });
    const before = await one(supabase, contract.table, entityId);
    const lifecycleStatus = action === "archive" ? "archived" : action === "restore" ? "active" : action === "cancel" ? "cancelled" : "active";
    const updatePayload: JsonRecord = {
      lifecycle_status: lifecycleStatus,
      archived_at: action === "archive" ? now() : null,
      archived_by: action === "archive" ? actorName(actor) : null,
      archive_reason: action === "archive" ? clean(payload.reason) || "Archived by operator" : null,
      updated_at: now(),
    };
    if ("status" in before && action !== "archive" && action !== "restore") updatePayload.status = lifecycleStatus;
    const result = await supabase.from(contract.table).update(updatePayload).eq("id", entityId).select("*").single();
    if (result.error) throw result.error;
    const command = await commandResult(supabase, { commandKey: action, workspaceKey: contract.workspace, actor, status: "completed", summary: `${contract.title} marked ${lifecycleStatus}.`, updated: [result.data as JsonRecord], result: { before, after: result.data as JsonRecord }, requestId });
    return { record: result.data, command };
  }

  if (action === "edit-record") {
    if (!contract || !entityId) throw Object.assign(new Error("ENTITY_REQUIRED"), { status: 400 });
    const before = await one(supabase, contract.table, entityId);
    const expectedVersion = Number(payload.expectedVersion || before.record_version || 1);
    const changes = object(payload.changes);
    const updatePayload: JsonRecord = {};
    for (const field of contract.allowedFields) {
      if (Object.prototype.hasOwnProperty.call(changes, field)) updatePayload[field] = changes[field];
    }
    if (!Object.keys(updatePayload).length) throw Object.assign(new Error("NO_ALLOWED_CHANGES"), { status: 400 });
    updatePayload.updated_at = now();
    let request = supabase.from(contract.table).update(updatePayload).eq("id", entityId);
    if (before.record_version != null) request = request.eq("record_version", expectedVersion);
    const result = await request.select("*").maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) throw Object.assign(new Error("AC_CAPITAL_OPTIMISTIC_LOCK_CONFLICT"), { status: 409, currentVersion: before.record_version });
    const command = await commandResult(supabase, { commandKey: action, workspaceKey: contract.workspace, actor, status: "completed", summary: `${contract.title} updated with version control.`, updated: [result.data as JsonRecord], result: { before, after: result.data as JsonRecord }, requestId });
    return { record: result.data, command };
  }

  if (action === "merge-record") {
    if (!contract || !entityId || !clean(payload.targetId)) throw Object.assign(new Error("SOURCE_AND_TARGET_REQUIRED"), { status: 400 });
    const targetId = clean(payload.targetId);
    if (targetId === entityId) throw Object.assign(new Error("MERGE_TARGET_MUST_DIFFER"), { status: 400 });
    const source = await one(supabase, contract.table, entityId);
    const target = await one(supabase, contract.table, targetId);
    const result = await supabase.from(contract.table).update({ merged_into_id: targetId, lifecycle_status: "merged", archived_at: now(), archived_by: actorName(actor), archive_reason: clean(payload.reason || `Merged into ${targetId}`), updated_at: now() }).eq("id", entityId).select("*").single();
    if (result.error) throw result.error;
    const link = await supabase.from("ac_capital_entity_links").upsert({ from_type: entityType, from_id: entityId, relation_type: "merged-into", to_type: entityType, to_id: targetId, metadata: { reason: clean(payload.reason), actor: actorName(actor) } }, { onConflict: "from_type,from_id,relation_type,to_type,to_id" }).select("*").single();
    if (link.error) throw link.error;
    const command = await commandResult(supabase, { commandKey: action, workspaceKey: contract.workspace, actor, status: "completed", summary: `${contract.title} merged without destructive deletion.`, updated: [result.data as JsonRecord], created: [link.data as JsonRecord], result: { source, target, merged: result.data as JsonRecord, link: link.data as JsonRecord }, requestId });
    return { source: result.data, target, link: link.data, command };
  }

  if (action === "save-view") {
    const workspaceKey = clean(payload.workspaceKey);
    const name = clean(payload.name);
    if (!workspaceKey || !name) throw Object.assign(new Error("WORKSPACE_AND_VIEW_NAME_REQUIRED"), { status: 400 });
    const result = await supabase.from("ac_capital_saved_views").upsert({
      workspace_key: workspaceKey, name, description: clean(payload.description) || null,
      query_state: object(payload.queryState), visibility: clean(payload.visibility || "private"),
      owner_id: clean(actor.id) || null, owner_name: actorName(actor), is_default: payload.isDefault === true, updated_at: now(),
    }, { onConflict: "workspace_key,owner_id,name" }).select("*").single();
    if (result.error) throw result.error;
    return { view: result.data, command: await commandResult(supabase, { commandKey: action, workspaceKey, actor, status: "completed", summary: "Saved view persisted.", created: [result.data as JsonRecord], result: { view: result.data as JsonRecord }, requestId }) };
  }

  if (action === "mark-notification") {
    const notificationId = clean(payload.notificationId);
    if (!notificationId) throw Object.assign(new Error("NOTIFICATION_REQUIRED"), { status: 400 });
    const status = clean(payload.status || "read");
    const result = await supabase.from("ac_capital_notifications").update({
      status, read_at: status === "read" ? now() : null, dismissed_at: status === "dismissed" ? now() : null, updated_at: now(),
    }).eq("id", notificationId).select("*").single();
    if (result.error) throw result.error;
    return { notification: result.data };
  }

  if (action === "stage-transition") {
    if (!contract || !entityId || !clean(payload.requestedStage)) throw Object.assign(new Error("ENTITY_AND_STAGE_REQUIRED"), { status: 400 });
    const gate = await evaluateStageGates({ entityType, entityId, workspaceKey: clean(payload.workspaceKey || contract.workspace), requestedStage: clean(payload.requestedStage), actor });
    if (!gate.passed) throw Object.assign(new Error(`AC_CAPITAL_STAGE_GATE_BLOCKED:${gate.blockers.map((item) => clean(item.label)).join(" | ")}`), { status: 409, detail: gate });
    const field = entityType === "pipeline" ? "stage" : "lifecycle_status";
    const result = await supabase.from(contract.table).update({ [field]: clean(payload.requestedStage), updated_at: now() }).eq("id", entityId).select("*").single();
    if (result.error) throw result.error;
    return { record: result.data, gate, command: await commandResult(supabase, { commandKey: action, workspaceKey: contract.workspace, actor, status: "completed", summary: `Stage advanced to ${clean(payload.requestedStage)}.`, updated: [result.data as JsonRecord], result: { record: result.data as JsonRecord, gate }, requestId }) };
  }

  if (action === "record-submission-proof") {
    const proofReference = clean(payload.proofReference);
    if (!proofReference) throw Object.assign(new Error("SUBMISSION_PROOF_REFERENCE_REQUIRED"), { status: 400 });
    const result = await supabase.from("ac_capital_submission_proofs").insert({
      pipeline_record_id: clean(payload.pipelineRecordId) || null,
      case_id: clean(payload.caseId) || null,
      coordinator_task_id: clean(payload.coordinatorTaskId) || null,
      approval_id: clean(payload.approvalId) || null,
      submission_channel: clean(payload.submissionChannel) || null,
      recipient: clean(payload.recipient) || null,
      submitted_at: clean(payload.submittedAt) || now(),
      proof_reference: proofReference,
      proof_type: clean(payload.proofType || "manual-evidence"),
      submitted_by: actorName(actor),
      metadata: object(payload.metadata),
    }).select("*").single();
    if (result.error) throw result.error;
    return { proof: result.data, command: await commandResult(supabase, { commandKey: action, workspaceKey: "coordinator", actor, status: "completed", summary: "External submission proof recorded.", created: [result.data as JsonRecord], result: { proof: result.data as JsonRecord }, requestId }) };
  }

  throw Object.assign(new Error(`AC_CAPITAL_UNSUPPORTED_INSTITUTIONAL_ACTION:${action}`), { status: 400 });
}

export function snapshotHash(snapshot: JsonRecord) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}
