import { createServiceClient } from "@/lib/supabase/server";
import { executeRadarWorkbenchAction } from "./radar-workbench";
import type { JsonRecord } from "./free-provider-types";

const now = () => new Date().toISOString();
const clean = (value: unknown) => String(value ?? "").trim();
const object = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};

type Actor = { id?: string; name?: string; email?: string; role?: string };
const actorName = (actor: Actor) => clean(actor.email || actor.name || actor.id || "AC Capital Orchestrator");

async function table(supabase: any, name: string, limit = 200) {
  const result = await supabase.from(name).select("*").order("created_at", { ascending: false }).limit(limit);
  if (result.error) throw new Error(result.error.message);
  return (result.data || []) as JsonRecord[];
}
async function insert(supabase: any, name: string, payload: JsonRecord) {
  const result = await supabase.from(name).insert(payload).select("*").single();
  if (result.error) throw new Error(result.error.message);
  return result.data as JsonRecord;
}
async function update(supabase: any, name: string, id: string, payload: JsonRecord) {
  const result = await supabase.from(name).update({ ...payload, updated_at: now() }).eq("id", id).select("*").single();
  if (result.error) throw new Error(result.error.message);
  return result.data as JsonRecord;
}
async function maybe(supabase: any, name: string, field: string, value: unknown) {
  const result = await supabase.from(name).select("*").eq(field, value).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? result.data as JsonRecord : null;
}
async function link(supabase: any, fromType: string, fromId: string, relation: string, toType: string, toId: string, metadata: JsonRecord = {}) {
  if (!fromId || !toId) return;
  const result = await supabase.from("ac_capital_entity_links").upsert({ from_type: fromType, from_id: fromId, relation_type: relation, to_type: toType, to_id: toId, metadata }, { onConflict: "from_type,from_id,relation_type,to_type,to_id" });
  if (result.error) throw new Error(result.error.message);
}

export async function emitCapitalEvent(input: { eventType: string; entityType: string; entityId?: string | null; sourceWorkspace: string; payload?: JsonRecord; idempotencyKey?: string; priority?: string; actor?: string }) {
  const supabase = createServiceClient();
  const idempotencyKey = input.idempotencyKey || `${input.eventType}:${input.entityType}:${input.entityId || "none"}:${clean(input.payload?.version || input.payload?.updated_at || "v1")}`;
  const result = await supabase.from("ac_capital_orchestrator_events").upsert({ event_type: input.eventType, entity_type: input.entityType, entity_id: input.entityId || null, source_workspace: input.sourceWorkspace, payload: input.payload || {}, idempotency_key: idempotencyKey, priority: input.priority || "normal", status: "queued", available_at: now(), created_by: input.actor || null, updated_at: now() }, { onConflict: "idempotency_key", ignoreDuplicates: true }).select("*").maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data as JsonRecord | null;
}

async function ensureWorkflow(supabase: any, event: JsonRecord, actor: Actor) {
  const rootId = clean(event.entity_id);
  let workflow = rootId ? await supabase.from("ac_capital_orchestrator_workflows").select("*").eq("root_entity_type", event.entity_type).eq("root_entity_id", rootId).in("status", ["active", "blocked", "waiting-approval"]).maybeSingle() : { data: null, error: null } as any;
  if (workflow.error) throw new Error(workflow.error.message);
  if (workflow.data) return workflow.data as JsonRecord;
  return insert(supabase, "ac_capital_orchestrator_workflows", { workflow_type: "capital-lifecycle", title: `${clean(event.entity_type)} · ${rootId || clean(event.event_type)}`, root_entity_type: event.entity_type, root_entity_id: rootId || null, status: "active", current_stage: "intake", automation_mode: "internal-auto", next_action: "Process orchestrator event", created_by: actorName(actor), trace: { sourceEventId: event.id, eventType: event.event_type } });
}

async function recordStep(supabase: any, workflowId: string, stepKey: string, workspaceKey: string, capability: string, status: string, output: JsonRecord = {}, error?: unknown) {
  const payload: JsonRecord = { workflow_id: workflowId, step_key: stepKey, workspace_key: workspaceKey, capability, status, output_snapshot: output, completed_at: ["completed", "failed", "blocked"].includes(status) ? now() : null, updated_at: now() };
  if (error) { payload.error_code = error instanceof Error ? error.message.split(":")[0] : "ORCHESTRATOR_ERROR"; payload.error_message = error instanceof Error ? error.message : clean(error); }
  const result = await supabase.from("ac_capital_orchestrator_steps").upsert(payload, { onConflict: "workflow_id,step_key" }).select("*").single();
  if (result.error) throw new Error(result.error.message);
  return result.data as JsonRecord;
}

async function processEvent(event: JsonRecord, actor: Actor) {
  const supabase = createServiceClient();
  const workflow = await ensureWorkflow(supabase, event, actor);
  const workflowId = clean(workflow.id);
  const type = clean(event.event_type);
  const entityId = clean(event.entity_id);
  const payload = object(event.payload);
  let output: JsonRecord = {};

  if (["source.validated", "opportunity.created", "opportunity.qualify.requested"].includes(type)) {
    const action = type === "source.validated" ? "send-to-qualification" : clean(payload.fullChain) === "true" || payload.fullChain === true ? "convert-full-chain" : "send-to-qualification";
    output = await executeRadarWorkbenchAction({ action, payload: { sourceId: type === "source.validated" ? entityId : undefined, opportunityId: type !== "source.validated" ? entityId : undefined, reason: `Orchestrated from ${type}` }, actor: actor as any });
    const opportunity = object(output.opportunity); const dossier = object(output.dossier); const caseRow = object(output.case); const pipeline = object(output.pipeline);
    if (opportunity.id) await link(supabase, "workflow", workflowId, "contains", "opportunity", clean(opportunity.id));
    if (dossier.id) await link(supabase, "opportunity", clean(opportunity.id), "qualified-by", "qualification", clean(dossier.id));
    if (caseRow.id) await link(supabase, "qualification", clean(dossier.id), "materialized-as", "case", clean(caseRow.id));
    if (pipeline.id) await link(supabase, "case", clean(caseRow.id), "tracked-in", "pipeline", clean(pipeline.id));
    await update(supabase, "ac_capital_orchestrator_workflows", workflowId, { opportunity_id: opportunity.id || null, qualification_dossier_id: dossier.id || null, case_id: caseRow.id || null, pipeline_record_id: pipeline.id || null, current_stage: caseRow.id ? "case-production" : "qualification", next_action: caseRow.id ? "Close proof gaps and prepare approval" : "Complete qualification" });
    await recordStep(supabase, workflowId, type, "qualification", "opportunity_qualification", "completed", output);
  } else if (["qualification.pursue", "qualification.approved"].includes(type)) {
    output = await executeRadarWorkbenchAction({ action: "convert-full-chain", payload: { opportunityId: clean(payload.opportunityId), reason: `Orchestrated from ${type}` }, actor: actor as any });
    await update(supabase, "ac_capital_orchestrator_workflows", workflowId, { current_stage: "case-production", opportunity_id: clean(object(output.opportunity).id) || null, qualification_dossier_id: clean(object(output.dossier).id) || entityId || null, case_id: clean(object(output.case).id) || null, pipeline_record_id: clean(object(output.pipeline).id) || null, next_action: "Complete proof pack and request founder approval" });
    await recordStep(supabase, workflowId, type, "cases", "case_drafting", "completed", output);
  } else if (["case.ready", "case.approval.requested"].includes(type)) {
    const caseRow = await maybe(supabase, "ac_capital_cases", "id", entityId);
    if (!caseRow) throw new Error("CASE_NOT_FOUND");
    const snapshotVersion = clean(caseRow.updated_at || caseRow.created_at || now());
    const approval = await insert(supabase, "ac_capital_universal_approvals", { approval_type: "case-external-execution", object_type: "case", object_id: entityId, object_version: snapshotVersion, snapshot: caseRow, evidence_package: { caseId: entityId, radarSourceIds: caseRow.radar_source_ids || [] }, decision_requested: "Approve controlled external execution preparation", risk_level: "high", status: "pending", requested_by: actorName(actor), approver_role: "founder" });
    output = { approval };
    await update(supabase, "ac_capital_orchestrator_workflows", workflowId, { status: "waiting-approval", current_stage: "founder-approval", next_action: "Founder decision required" });
    await recordStep(supabase, workflowId, type, "approvals", "approval_governance", "completed", output);
  } else if (type === "approval.granted") {
    const approval = await maybe(supabase, "ac_capital_universal_approvals", "id", entityId);
    if (!approval) throw new Error("APPROVAL_NOT_FOUND");
    const task = await insert(supabase, "ac_capital_coordinator_tasks", { task_title: `Execute approved ${clean(approval.object_type)} action`, task_type: "external-execution", status: "ready", priority: "high", owner: actorName(actor), related_entity_type: approval.object_type, related_entity_id: approval.object_id, objective: clean(approval.decision_requested), next_action: "Execute manually and upload proof", external_action_locked: false, metadata: { universalApprovalId: approval.id, approvedVersion: approval.object_version } });
    output = { task };
    await update(supabase, "ac_capital_orchestrator_workflows", workflowId, { status: "active", current_stage: "coordinator-execution", next_action: "Coordinator executes approved mission and records proof" });
    await recordStep(supabase, workflowId, type, "coordinator", "mission_preparation", "completed", output);
  } else if (type === "outcome.recorded") {
    const learning = await insert(supabase, "ac_capital_outcome_learning", { opportunity_id: clean(payload.opportunityId) || null, case_id: clean(payload.caseId) || null, pipeline_record_id: clean(payload.pipelineRecordId) || null, outcome: clean(payload.outcome || "recorded"), outcome_reason: clean(payload.reason) || null, objections: payload.objections || [], proof_friction: payload.proofFriction || [], successful_patterns: payload.successfulPatterns || [], failed_patterns: payload.failedPatterns || [], doctrine_proposals: payload.doctrineProposals || [], scoring_proposals: payload.scoringProposals || [], created_by: actorName(actor) });
    output = { learning };
    await update(supabase, "ac_capital_orchestrator_workflows", workflowId, { status: "completed", current_stage: "learning", completed_at: now(), next_action: "Review learning proposals" });
    await recordStep(supabase, workflowId, type, "learning", "learning_analysis", "completed", output);
  } else {
    output = { recorded: true, eventType: type, note: "Event preserved for manual or future agent handling." };
    await recordStep(supabase, workflowId, type, clean(event.source_workspace), "event_triage", "completed", output);
  }
  return { workflow: await maybe(supabase, "ac_capital_orchestrator_workflows", "id", workflowId), output };
}

export async function processCapitalOrchestratorQueue(actor: Actor, maxEvents = 10) {
  const supabase = createServiceClient();
  const query = await supabase.from("ac_capital_orchestrator_events").select("*").eq("status", "queued").lte("available_at", now()).order("created_at", { ascending: true }).limit(Math.max(1, Math.min(50, maxEvents)));
  if (query.error) throw new Error(query.error.message);
  const results: JsonRecord[] = [];
  for (const event of (query.data || []) as JsonRecord[]) {
    const id = clean(event.id);
    await update(supabase, "ac_capital_orchestrator_events", id, { status: "processing", locked_at: now(), locked_by: actorName(actor), attempts: Number(event.attempts || 0) + 1 });
    try {
      const result = await processEvent(event, actor);
      await update(supabase, "ac_capital_orchestrator_events", id, { status: "completed", processed_at: now(), error_code: null, error_message: null });
      results.push({ eventId: id, status: "completed", ...result });
    } catch (error) {
      await update(supabase, "ac_capital_orchestrator_events", id, { status: Number(event.attempts || 0) >= 2 ? "failed" : "queued", available_at: new Date(Date.now() + 60_000).toISOString(), error_code: error instanceof Error ? error.message.split(":")[0] : "ORCHESTRATOR_ERROR", error_message: error instanceof Error ? error.message : clean(error) });
      results.push({ eventId: id, status: "failed", error: error instanceof Error ? error.message : clean(error) });
    }
  }
  return { processed: results.length, results };
}

export async function runCapitalIntegrityScan(actor: Actor) {
  const supabase = createServiceClient();
  const issues: JsonRecord[] = [];
  const checks = [
    { table: "ac_capital_radar_opportunities", type: "opportunity", code: "OPPORTUNITY_WITHOUT_EVIDENCE", filter: (row: JsonRecord) => !row.source_id && !row.cluster_id && Number(row.linked_source_count || 0) === 0, title: "Opportunity has no evidence linkage", action: "Attach validated source evidence or reject the opportunity." },
    { table: "ac_capital_qualification_dossiers", type: "qualification", code: "QUALIFICATION_WITHOUT_OPPORTUNITY", filter: (row: JsonRecord) => !row.radar_opportunity_id, title: "Qualification dossier has no opportunity", action: "Link the dossier to a canonical opportunity." },
    { table: "ac_capital_cases", type: "case", code: "CASE_WITHOUT_QUALIFICATION", filter: (row: JsonRecord) => !row.qualification_dossier_id && !row.radar_opportunity_id, title: "Funding case lacks qualification provenance", action: "Link an approved qualification or record an explicit founder override." },
    { table: "ac_capital_pipeline_records", type: "pipeline", code: "PIPELINE_WITHOUT_NEXT_ACTION", filter: (row: JsonRecord) => !clean(row.next_action), title: "Pipeline record has no next action", action: "Assign owner, due date and next action." },
    { table: "ac_capital_coordinator_tasks", type: "coordinator-task", code: "EXTERNAL_TASK_WITHOUT_APPROVAL", filter: (row: JsonRecord) => clean(row.task_type).includes("external") && row.external_action_locked === false && !object(row.metadata).universalApprovalId, title: "External mission is missing universal approval", action: "Lock the mission or attach a valid approval snapshot." },
  ];
  for (const check of checks) {
    const rows = await table(supabase, check.table, 500);
    for (const row of rows.filter(check.filter)) {
      const issuePayload = { issue_code: check.code, entity_type: check.type, entity_id: row.id, severity: check.code.includes("APPROVAL") ? "critical" : "high", status: "open", title: check.title, detail: `Detected in ${check.table}`, recommended_action: check.action, auto_repairable: false, detected_snapshot: row, detected_at: now() };
      const result = await supabase.from("ac_capital_integrity_issues").upsert(issuePayload, { onConflict: "issue_code,entity_type,entity_id" }).select("*").single();
      if (!result.error) issues.push(result.data as JsonRecord);
    }
  }
  return { actor: actorName(actor), detected: issues.length, issues };
}

export async function compileCapitalDoctrine(actor: Actor) {
  const supabase = createServiceClient();
  const [items, commands, prompts, skills, injections, conflicts] = await Promise.all([
    table(supabase, "ac_capital_doctrine_items", 500), table(supabase, "ac_capital_doctrine_commands", 300), table(supabase, "ac_capital_doctrine_prompts", 300), table(supabase, "ac_capital_doctrine_skills", 300), table(supabase, "ac_capital_doctrine_monthly_injections", 100), table(supabase, "ac_capital_doctrine_conflicts", 100),
  ]);
  const active = (rows: JsonRecord[]) => rows.filter((row) => !["retired", "rejected", "inactive"].includes(clean(row.status).toLowerCase()));
  const bundle = { compiledAt: now(), items: active(items), commands: active(commands), prompts: active(prompts), skills: active(skills), monthlyInjections: active(injections), unresolvedConflicts: conflicts.filter((row) => !["resolved", "closed"].includes(clean(row.status).toLowerCase())) };
  const key = `capital-department:${new Date().toISOString().slice(0, 10)}`;
  const result = await supabase.from("ac_capital_doctrine_compilations").upsert({ compilation_key: key, scope: "capital-department", effective_bundle: bundle, source_versions: active(items).map((row) => ({ id: row.id, version: row.version || row.updated_at })), conflicts: bundle.unresolvedConflicts, status: bundle.unresolvedConflicts.length ? "conflicted" : "active", compiled_by: actorName(actor), compiled_at: now() }, { onConflict: "compilation_key" }).select("*").single();
  if (result.error) throw new Error(result.error.message);
  return result.data as JsonRecord;
}

export async function loadCapitalOrchestratorSnapshot() {
  const supabase = createServiceClient();
  const [events, workflows, steps, agents, approvals, integrity, doctrine, learnings, links] = await Promise.all([
    table(supabase, "ac_capital_orchestrator_events", 150), table(supabase, "ac_capital_orchestrator_workflows", 100), table(supabase, "ac_capital_orchestrator_steps", 400), table(supabase, "ac_capital_agent_registry", 100), table(supabase, "ac_capital_universal_approvals", 150), table(supabase, "ac_capital_integrity_issues", 200), table(supabase, "ac_capital_doctrine_compilations", 20), table(supabase, "ac_capital_outcome_learning", 100), table(supabase, "ac_capital_entity_links", 500),
  ]);
  return { events, workflows, steps, agents, approvals, integrity, doctrine, learnings, links, generatedAt: now() };
}

export async function executeCapitalOrchestratorAction(action: string, payload: JsonRecord, actor: Actor) {
  if (action === "emit-event") return { event: await emitCapitalEvent({ eventType: clean(payload.eventType), entityType: clean(payload.entityType), entityId: clean(payload.entityId) || null, sourceWorkspace: clean(payload.sourceWorkspace || "orchestrator"), payload: object(payload.payload), idempotencyKey: clean(payload.idempotencyKey) || undefined, priority: clean(payload.priority || "normal"), actor: actorName(actor) }) };
  if (action === "process-queue") return processCapitalOrchestratorQueue(actor, Number(payload.maxEvents || 10));
  if (action === "integrity-scan") return runCapitalIntegrityScan(actor);
  if (action === "compile-doctrine") return compileCapitalDoctrine(actor);
  if (action === "convert-opportunity-full-chain") {
    const opportunityId = clean(payload.opportunityId); if (!opportunityId) throw new Error("OPPORTUNITY_REQUIRED");
    const event = await emitCapitalEvent({ eventType: "opportunity.created", entityType: "opportunity", entityId: opportunityId, sourceWorkspace: "orchestrator", payload: { fullChain: true }, idempotencyKey: `full-chain:${opportunityId}:${Date.now()}`, actor: actorName(actor), priority: "high" });
    return { event, queue: await processCapitalOrchestratorQueue(actor, 1) };
  }
  if (action === "approval-decision") {
    const supabase = createServiceClient(); const approvalId = clean(payload.approvalId); const decision = clean(payload.decision);
    if (!approvalId || !["approved", "rejected"].includes(decision)) throw new Error("VALID_APPROVAL_DECISION_REQUIRED");
    const approval = await update(supabase, "ac_capital_universal_approvals", approvalId, { status: decision, decided_by: actorName(actor), decided_at: now(), decision_note: clean(payload.note) || null });
    if (decision === "approved") await emitCapitalEvent({ eventType: "approval.granted", entityType: "approval", entityId: approvalId, sourceWorkspace: "approvals", payload: { objectType: approval.object_type, objectId: approval.object_id }, idempotencyKey: `approval-granted:${approvalId}:${approval.object_version}`, actor: actorName(actor), priority: "high" });
    return { approval };
  }
  throw new Error(`UNSUPPORTED_ORCHESTRATOR_ACTION:${action}`);
}
