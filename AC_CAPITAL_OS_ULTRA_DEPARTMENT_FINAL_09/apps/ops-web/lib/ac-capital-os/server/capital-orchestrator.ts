import { createServiceClient } from "@/lib/supabase/server";
import { executeRadarWorkbenchAction } from "./radar-workbench";
import { executeCapitalAgentForEvent } from "./capital-agent-executors";
import { createNotification, snapshotHash } from "./institutional-runtime";
import type { JsonRecord } from "./free-provider-types";

// AC_CAPITAL_EXECUTIVE_ORCHESTRATOR_COMMAND_WORKBENCH_08

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

type SnapshotTableResult = {
  rows: JsonRecord[];
  warning: JsonRecord | null;
};

async function snapshotTable(
  supabase: any,
  name: string,
  limit: number,
  orderColumns: string[],
): Promise<SnapshotTableResult> {
  const errors: string[] = [];

  for (const orderColumn of orderColumns) {
    const result = await supabase
      .from(name)
      .select("*")
      .order(orderColumn, { ascending: false })
      .limit(limit);

    if (!result.error) {
      return {
        rows: (result.data || []) as JsonRecord[],
        warning: errors.length
          ? {
              table: name,
              recovered: true,
              orderColumn,
              previousErrors: errors,
            }
          : null,
      };
    }

    errors.push(`${orderColumn}: ${result.error.message}`);
  }

  const unordered = await supabase.from(name).select("*").limit(limit);
  if (!unordered.error) {
    return {
      rows: (unordered.data || []) as JsonRecord[],
      warning: {
        table: name,
        recovered: true,
        orderColumn: null,
        previousErrors: errors,
      },
    };
  }

  return {
    rows: [],
    warning: {
      table: name,
      recovered: false,
      error: unordered.error.message,
      previousErrors: errors,
    },
  };
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
  const supabase = await createServiceClient();
  const idempotencyKey = input.idempotencyKey || `${input.eventType}:${input.entityType}:${input.entityId || "none"}:${clean(input.payload?.version || input.payload?.updated_at || "v1")}`;
  const result = await supabase.from("ac_capital_orchestrator_events").upsert({ event_type: input.eventType, entity_type: input.entityType, entity_id: input.entityId || null, source_workspace: input.sourceWorkspace, payload: input.payload || {}, idempotency_key: idempotencyKey, priority: input.priority || "normal", status: "queued", available_at: now(), created_by: input.actor || null, updated_at: now() }, { onConflict: "idempotency_key", ignoreDuplicates: true }).select("*").maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data as JsonRecord | null;
}

async function ensureWorkflow(supabase: any, event: JsonRecord, actor: Actor) {
  const rootId = clean(event.entity_id);
  const entityType = clean(event.entity_type);
  const lifecycleColumn: Record<string, string> = {
    opportunity: "opportunity_id",
    qualification: "qualification_dossier_id",
    case: "case_id",
    pipeline: "pipeline_record_id",
    approval: "approval_id",
  };

  if (rootId && lifecycleColumn[entityType]) {
    const connected = await supabase
      .from("ac_capital_orchestrator_workflows")
      .select("*")
      .eq(lifecycleColumn[entityType], rootId)
      .in("status", ["active", "blocked", "waiting-approval"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (connected.error) throw new Error(connected.error.message);
    if (connected.data) return connected.data as JsonRecord;
  }

  const workflow = rootId
    ? await supabase
        .from("ac_capital_orchestrator_workflows")
        .select("*")
        .eq("root_entity_type", entityType)
        .eq("root_entity_id", rootId)
        .in("status", ["active", "blocked", "waiting-approval"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : ({ data: null, error: null } as any);

  if (workflow.error) throw new Error(workflow.error.message);
  if (workflow.data) return workflow.data as JsonRecord;

  return insert(supabase, "ac_capital_orchestrator_workflows", {
    workflow_type: "capital-lifecycle",
    title: `${entityType} · ${rootId || clean(event.event_type)}`,
    root_entity_type: entityType,
    root_entity_id: rootId || null,
    status: "active",
    current_stage: "intake",
    automation_mode: "internal-auto",
    next_action: "Process orchestrator event",
    created_by: actorName(actor),
    trace: { sourceEventId: event.id, eventType: event.event_type },
  });
}

async function recordStep(supabase: any, workflowId: string, stepKey: string, workspaceKey: string, capability: string, status: string, output: JsonRecord = {}, error?: unknown) {
  const payload: JsonRecord = { workflow_id: workflowId, step_key: stepKey, workspace_key: workspaceKey, capability, status, output_snapshot: output, completed_at: ["completed", "failed", "blocked"].includes(status) ? now() : null, updated_at: now() };
  if (error) { payload.error_code = error instanceof Error ? error.message.split(":")[0] : "ORCHESTRATOR_ERROR"; payload.error_message = error instanceof Error ? error.message : clean(error); }
  const result = await supabase.from("ac_capital_orchestrator_steps").upsert(payload, { onConflict: "workflow_id,step_key" }).select("*").single();
  if (result.error) throw new Error(result.error.message);
  return result.data as JsonRecord;
}

async function processEvent(event: JsonRecord, actor: Actor) {
  const supabase = await createServiceClient();
  const workflow = await ensureWorkflow(supabase, event, actor);
  const workflowId = clean(workflow.id);
  const type = clean(event.event_type);
  const entityId = clean(event.entity_id);
  const payload = object(event.payload);
  let output: JsonRecord = {};

  // Final 09: route every supported lifecycle event through a genuinely executable
  // doctrine-bound institutional agent before falling back to deterministic handling.
  if (type !== "source.validated" && type !== "case.ready" && type !== "case.approval.requested") {
    const agentExecution = await executeCapitalAgentForEvent({ event, workflow, actor });
    if (agentExecution) {
      const agentResult = object(agentExecution);
      const dossier = object(agentResult.dossier);
      const caseRow = object(agentResult.case);
      const pipeline = object(agentResult.pipeline);
      const task = object(agentResult.task);
      const artifact = object(agentResult.artifact);
      const learning = object(agentResult.learning);
      output = { agentExecution };

      const stage = type.startsWith("opportunity.") ? "qualification"
        : type.startsWith("qualification.") ? "case-production"
          : type.startsWith("document.") || type === "proof.updated" ? "proof"
            : type.startsWith("pipeline.") || type === "deadline.approaching" || type === "funder.response" ? "pipeline"
              : type === "approval.granted" ? "coordinator-execution"
                : type === "outcome.recorded" || type === "case.closed" || type === "submission.failed" ? "learning"
                  : type.startsWith("funder.") ? "funder-intelligence" : clean(workflow.current_stage || "intake");

      const workflowPatch: JsonRecord = {
        current_stage: stage,
        next_action: stage === "qualification" ? "Human review of AI underwriting"
          : stage === "case-production" ? "Review case draft, close proof gaps and satisfy the approval gate"
            : stage === "proof" ? "Close proof requirements and re-evaluate readiness"
              : stage === "pipeline" ? "Execute the recommended internal pipeline action"
                : stage === "coordinator-execution" ? "Coordinator executes manually and records proof"
                  : stage === "learning" ? "Review institutional learning proposals"
                    : "Review agent output",
        status: stage === "learning" ? "completed" : "active",
        completed_at: stage === "learning" ? now() : null,
      };

      if (type.startsWith("opportunity.") && entityId) workflowPatch.opportunity_id = entityId;
      if (dossier.id) workflowPatch.qualification_dossier_id = dossier.id;
      if (caseRow.id) workflowPatch.case_id = caseRow.id;
      if (pipeline.id) workflowPatch.pipeline_record_id = pipeline.id;
      if (type === "approval.granted" && entityId) workflowPatch.approval_id = entityId;
      if (task.id) workflowPatch.coordinator_task_id = task.id;

      await update(supabase, "ac_capital_orchestrator_workflows", workflowId, workflowPatch);

      if (dossier.id && entityId) await link(supabase, "opportunity", entityId, "qualified-by", "qualification", clean(dossier.id));
      if (caseRow.id && dossier.id) await link(supabase, "qualification", clean(dossier.id), "materialized-as", "case", clean(caseRow.id));
      if (pipeline.id && caseRow.id) await link(supabase, "case", clean(caseRow.id), "tracked-in", "pipeline", clean(pipeline.id));
      if (task.id && entityId) await link(supabase, "approval", entityId, "authorized-mission", "coordinator-task", clean(task.id));
      if (artifact.id) await link(supabase, "workflow", workflowId, "generated-artifact", "artifact", clean(artifact.id));
      if (learning.id) await link(supabase, "workflow", workflowId, "produced-learning", "learning", clean(learning.id));

      await recordStep(supabase, workflowId, type, clean(event.source_workspace), type.replaceAll(".", "_"), "completed", output);
      return { workflow: await maybe(supabase, "ac_capital_orchestrator_workflows", "id", workflowId), output };
    }
  }

  if (["source.validated"].includes(type)) {
    output = await executeRadarWorkbenchAction({
      action: "create-opportunity-from-source",
      payload: { sourceId: entityId, reason: `Orchestrated from ${type}` },
      actor: actor as any,
    });
    const opportunity = object(output.opportunity);
    if (!opportunity.id) throw new Error("OPPORTUNITY_MATERIALIZATION_FAILED");
    await link(supabase, "source", entityId, "materialized-as", "opportunity", clean(opportunity.id));
    await link(supabase, "workflow", workflowId, "contains", "opportunity", clean(opportunity.id));
    await update(supabase, "ac_capital_orchestrator_workflows", workflowId, {
      opportunity_id: opportunity.id,
      current_stage: "qualification",
      next_action: "AI Qualification Underwriter queued from validated evidence",
    });
    await recordStep(supabase, workflowId, type, "radar", "source_to_opportunity", "completed", output);
  } else if (["qualification.pursue", "qualification.approved"].includes(type)) {
    output = await executeRadarWorkbenchAction({ action: "convert-full-chain", payload: { opportunityId: clean(payload.opportunityId), reason: `Orchestrated from ${type}` }, actor: actor as any });
    await update(supabase, "ac_capital_orchestrator_workflows", workflowId, { current_stage: "case-production", opportunity_id: clean(object(output.opportunity).id) || null, qualification_dossier_id: clean(object(output.dossier).id) || entityId || null, case_id: clean(object(output.case).id) || null, pipeline_record_id: clean(object(output.pipeline).id) || null, next_action: "Complete proof pack and request founder approval" });
    await recordStep(supabase, workflowId, type, "cases", "case_drafting", "completed", output);
  } else if (["case.ready", "case.approval.requested"].includes(type)) {
    const caseRow = await maybe(supabase, "ac_capital_cases", "id", entityId);
    if (!caseRow) throw new Error("CASE_NOT_FOUND");

    const proofQuery = await supabase
      .from("ac_capital_case_proof_packs")
      .select("id,proof_type,available,required_for_case")
      .eq("case_id", entityId)
      .eq("required_for_case", true)
      .eq("available", false);
    if (proofQuery.error) throw new Error(proofQuery.error.message);

    const readiness = Number(caseRow.total_readiness_score || 0);
    const documentReadiness = Number(caseRow.document_readiness_score || 0);
    const missingProof = (proofQuery.data || []) as JsonRecord[];
    if (readiness < 70 || documentReadiness < 70 || missingProof.length > 0) {
      output = {
        blocked: true,
        readiness,
        documentReadiness,
        missingProof,
        reason: "Case does not satisfy the founder-approval readiness gate.",
      };
      await update(supabase, "ac_capital_orchestrator_workflows", workflowId, {
        status: "blocked",
        current_stage: "proof",
        blocked_reason: "Case readiness or required proof is incomplete",
        next_action: "Close proof gaps and request approval again",
      });
      await createNotification({
        notificationType: "case-approval-gate-blocked",
        severity: "warning",
        title: "Funding case blocked before founder approval",
        message: `Readiness ${readiness}% · Document readiness ${documentReadiness}% · Missing proof ${missingProof.length}`,
        entityType: "case",
        entityId,
        workspaceKey: "cases",
        actionHref: "/ac-capital-os/cases",
        deduplicationKey: `case-gate:${entityId}:${caseRow.record_version || 1}`,
      });
      await recordStep(supabase, workflowId, type, "approvals", "approval_readiness_gate", "blocked", output);
      return { workflow: await maybe(supabase, "ac_capital_orchestrator_workflows", "id", workflowId), output };
    }

    const snapshotVersion = String(caseRow.record_version || 1);
    const existingApproval = await supabase
      .from("ac_capital_universal_approvals")
      .select("*")
      .eq("object_type", "case")
      .eq("object_id", entityId)
      .eq("object_version", snapshotVersion)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingApproval.error) throw new Error(existingApproval.error.message);

    const approval = existingApproval.data || await insert(supabase, "ac_capital_universal_approvals", {
      approval_type: "case-external-execution",
      object_type: "case",
      object_id: entityId,
      object_version: snapshotVersion,
      snapshot: caseRow,
      evidence_package: { caseId: entityId, missingRequiredProof: 0, readiness, documentReadiness },
      decision_requested: "Approve controlled external execution preparation",
      risk_level: "high",
      status: "pending",
      requested_by: actorName(actor),
      approver_role: "founder",
    });

    await update(supabase, "ac_capital_cases", entityId, { founder_approval_status: "pending" });
    output = { approval, reusedExistingApproval: Boolean(existingApproval.data) };
    await update(supabase, "ac_capital_orchestrator_workflows", workflowId, {
      approval_id: approval.id,
      status: "waiting-approval",
      current_stage: "founder-approval",
      next_action: "Founder decision required on the exact case version",
    });
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
  const supabase = await createServiceClient();
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
      const attempts = Number(event.attempts || 0) + 1;
      const terminal = attempts >= 4;
      const message = error instanceof Error ? error.message : clean(error);
      await update(supabase, "ac_capital_orchestrator_events", id, {
        status: terminal ? "failed" : "queued",
        available_at: new Date(Date.now() + Math.min(15 * 60_000, 60_000 * Math.max(1, attempts))).toISOString(),
        locked_at: null,
        locked_by: null,
        error_code: error instanceof Error ? error.message.split(":")[0] : "ORCHESTRATOR_ERROR",
        error_message: message,
      });
      if (terminal) {
        await supabase.from("ac_capital_dead_letters").insert({
          event_id: id,
          event_type: event.event_type,
          entity_type: event.entity_type,
          entity_id: event.entity_id || null,
          payload: event.payload || {},
          attempts,
          error_code: error instanceof Error ? error.message.split(":")[0] : "ORCHESTRATOR_ERROR",
          error_message: message,
          last_failed_at: now(),
        });
        await createNotification({
          notificationType: "orchestrator-dead-letter",
          severity: "critical",
          title: `Capital event requires intervention: ${clean(event.event_type)}`,
          message,
          entityType: clean(event.entity_type),
          entityId: clean(event.entity_id) || undefined,
          workspaceKey: "orchestrator",
          actionHref: "/ac-capital-os/orchestrator",
          deduplicationKey: `dead-letter:${id}`,
        });
      }
      results.push({ eventId: id, status: terminal ? "dead-letter" : "retry-scheduled", error: message });
    }
  }
  return { processed: results.length, results };
}

export async function processCapitalEventById(actor: Actor, eventId: string) {
  const supabase = await createServiceClient();
  const event = await maybe(supabase, "ac_capital_orchestrator_events", "id", eventId);
  if (!event) throw new Error("ORCHESTRATOR_EVENT_NOT_FOUND");
  if (["completed", "cancelled"].includes(clean(event.status))) {
    throw new Error(`ORCHESTRATOR_EVENT_ALREADY_${clean(event.status).toUpperCase()}`);
  }

  await update(supabase, "ac_capital_orchestrator_events", eventId, {
    status: "processing",
    locked_at: now(),
    locked_by: actorName(actor),
    attempts: Number(event.attempts || 0) + 1,
  });

  try {
    const result = await processEvent(event, actor);
    const updatedEvent = await update(supabase, "ac_capital_orchestrator_events", eventId, {
      status: "completed",
      processed_at: now(),
      error_code: null,
      error_message: null,
    });
    return { event: updatedEvent, result };
  } catch (error) {
    const failedEvent = await update(supabase, "ac_capital_orchestrator_events", eventId, {
      status: "failed",
      processed_at: now(),
      error_code: error instanceof Error ? error.message.split(":")[0] : "ORCHESTRATOR_ERROR",
      error_message: error instanceof Error ? error.message : clean(error),
    });
    throw Object.assign(error instanceof Error ? error : new Error(clean(error)), {
      detail: { event: failedEvent },
    });
  }
}

export async function runCapitalIntegrityScan(actor: Actor) {
  const supabase = await createServiceClient();
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
  const supabase = await createServiceClient();
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
  const supabase = await createServiceClient();
  const [
    eventsResult,
    workflowsResult,
    stepsResult,
    agentsResult,
    approvalsResult,
    integrityResult,
    doctrineResult,
    learningsResult,
    linksResult,
    artifactsResult,
    notificationsResult,
    deadLettersResult,
    schedulesResult,
    agentOutputsResult,
    commandResultsResult,
  ] = await Promise.all([
    snapshotTable(supabase, "ac_capital_orchestrator_events", 150, ["created_at", "updated_at", "available_at"]),
    snapshotTable(supabase, "ac_capital_orchestrator_workflows", 100, ["updated_at", "created_at", "started_at"]),
    snapshotTable(supabase, "ac_capital_orchestrator_steps", 400, ["updated_at", "created_at", "started_at"]),
    snapshotTable(supabase, "ac_capital_agent_registry", 100, ["updated_at", "created_at"]),
    snapshotTable(supabase, "ac_capital_universal_approvals", 150, ["requested_at", "created_at", "updated_at"]),
    snapshotTable(supabase, "ac_capital_integrity_issues", 200, ["detected_at", "created_at", "updated_at"]),
    snapshotTable(supabase, "ac_capital_doctrine_compilations", 20, ["compiled_at", "created_at"]),
    snapshotTable(supabase, "ac_capital_outcome_learning", 100, ["updated_at", "created_at"]),
    snapshotTable(supabase, "ac_capital_entity_links", 500, ["created_at"]),
    snapshotTable(supabase, "ac_capital_artifacts", 100, ["updated_at", "created_at", "generated_at"]),
    snapshotTable(supabase, "ac_capital_notifications", 150, ["created_at", "updated_at"]),
    snapshotTable(supabase, "ac_capital_dead_letters", 100, ["last_failed_at", "created_at", "updated_at"]),
    snapshotTable(supabase, "ac_capital_agent_schedules", 100, ["next_run_at", "updated_at", "created_at"]),
    snapshotTable(supabase, "ac_capital_agent_outputs", 150, ["created_at", "updated_at"]),
    snapshotTable(supabase, "ac_capital_command_results", 100, ["created_at", "completed_at"]),
  ]);

  const loadWarnings = [
    eventsResult.warning,
    workflowsResult.warning,
    stepsResult.warning,
    agentsResult.warning,
    approvalsResult.warning,
    integrityResult.warning,
    doctrineResult.warning,
    learningsResult.warning,
    linksResult.warning,
    artifactsResult.warning,
    notificationsResult.warning,
    deadLettersResult.warning,
    schedulesResult.warning,
    agentOutputsResult.warning,
    commandResultsResult.warning,
  ].filter(Boolean);

  return {
    events: eventsResult.rows,
    workflows: workflowsResult.rows,
    steps: stepsResult.rows,
    agents: agentsResult.rows,
    approvals: approvalsResult.rows,
    integrity: integrityResult.rows,
    doctrine: doctrineResult.rows,
    learnings: learningsResult.rows,
    links: linksResult.rows,
    artifacts: artifactsResult.rows,
    notifications: notificationsResult.rows,
    deadLetters: deadLettersResult.rows,
    schedules: schedulesResult.rows,
    agentOutputs: agentOutputsResult.rows,
    commandResults: commandResultsResult.rows,
    loadWarnings,
    generatedAt: now(),
  };
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
    const supabase = await createServiceClient(); const approvalId = clean(payload.approvalId); const decision = clean(payload.decision);
    if (!approvalId || !["approved", "rejected"].includes(decision)) throw new Error("VALID_APPROVAL_DECISION_REQUIRED");
    const approval = await update(supabase, "ac_capital_universal_approvals", approvalId, { status: decision, decided_by: actorName(actor), decided_at: now(), decision_note: clean(payload.note) || null });
    if (decision === "approved") await emitCapitalEvent({ eventType: "approval.granted", entityType: "approval", entityId: approvalId, sourceWorkspace: "approvals", payload: { objectType: approval.object_type, objectId: approval.object_id }, idempotencyKey: `approval-granted:${approvalId}:${approval.object_version}`, actor: actorName(actor), priority: "high" });
    return { approval };
  }
  if (action === "set-agent-enabled") {
    const supabase = await createServiceClient();
    const agentId = clean(payload.agentId);
    if (!agentId) throw new Error("AGENT_REQUIRED");
    const agent = await update(supabase, "ac_capital_agent_registry", agentId, { enabled: payload.enabled === true });
    const agentKey = clean(agent.agent_key);
    const runtimeStatus = payload.enabled === true ? "active" : "paused";
    const runtimeAgent = await supabase.from("ac_capital_ai_agents").update({ status: runtimeStatus, updated_at: now() }).eq("agent_key", agentKey).select("*").maybeSingle();
    if (runtimeAgent.error) throw runtimeAgent.error;
    const schedule = await supabase.from("ac_capital_agent_schedules").update({ enabled: payload.enabled === true, updated_at: now() }).eq("agent_key", agentKey).select("*").maybeSingle();
    if (schedule.error) throw schedule.error;
    return { agent, runtimeAgent: runtimeAgent.data || null, schedule: schedule.data || null };
  }
  if (action === "set-agent-schedule") {
    const supabase = await createServiceClient();
    const agentKey = clean(payload.agentKey);
    if (!agentKey) throw new Error("AGENT_KEY_REQUIRED");
    const allowed = ["hourly", "daily", "weekly", "monthly", "custom"];
    const frequencyKey = clean(payload.frequencyKey || "daily");
    if (!allowed.includes(frequencyKey)) throw new Error("VALID_FREQUENCY_REQUIRED");
    const result = await supabase.from("ac_capital_agent_schedules").upsert({
      agent_key: agentKey,
      enabled: payload.enabled === true,
      frequency_key: frequencyKey,
      timezone: clean(payload.timezone || "Africa/Casablanca"),
      schedule: object(payload.schedule),
      next_run_at: null,
      consecutive_failures: 0,
      updated_at: now(),
    }, { onConflict: "agent_key" }).select("*").single();
    if (result.error) throw result.error;
    const aiAgent = await supabase.from("ac_capital_ai_agents").update({
      trigger_mode: payload.enabled === true ? "both" : "manual",
      frequency_key: frequencyKey,
      schedule: object(payload.schedule),
      updated_at: now(),
    }).eq("agent_key", agentKey).select("*").maybeSingle();
    if (aiAgent.error) throw aiAgent.error;
    return { schedule: result.data, runtimeAgent: aiAgent.data || null };
  }
  if (action === "event-retry") {
    const supabase = await createServiceClient();
    const eventId = clean(payload.eventId);
    if (!eventId) throw new Error("EVENT_REQUIRED");
    const event = await update(supabase, "ac_capital_orchestrator_events", eventId, {
      status: "queued",
      available_at: now(),
      locked_at: null,
      locked_by: null,
      processed_at: null,
      error_code: null,
      error_message: null,
    });
    return { event };
  }
  if (action === "event-cancel") {
    const supabase = await createServiceClient();
    const eventId = clean(payload.eventId);
    if (!eventId) throw new Error("EVENT_REQUIRED");
    const event = await update(supabase, "ac_capital_orchestrator_events", eventId, {
      status: "cancelled",
      processed_at: now(),
      locked_at: null,
      locked_by: null,
    });
    return { event };
  }
  if (action === "process-event") {
    const eventId = clean(payload.eventId);
    if (!eventId) throw new Error("EVENT_REQUIRED");
    return processCapitalEventById(actor, eventId);
  }
  if (action === "resolve-integrity" || action === "reopen-integrity") {
    const supabase = await createServiceClient();
    const issueId = clean(payload.issueId);
    if (!issueId) throw new Error("INTEGRITY_ISSUE_REQUIRED");
    const resolved = action === "resolve-integrity";
    const issue = await update(supabase, "ac_capital_integrity_issues", issueId, {
      status: resolved ? "resolved" : "open",
      resolved_at: resolved ? now() : null,
      resolution_note: clean(payload.note) || null,
    });
    return { issue };
  }
  if (action === "workflow-command") {
    const supabase = await createServiceClient();
    const workflowId = clean(payload.workflowId);
    const command = clean(payload.command);
    if (!workflowId || !["pause", "resume", "cancel"].includes(command)) throw new Error("VALID_WORKFLOW_COMMAND_REQUIRED");
    const workflow = await update(supabase, "ac_capital_orchestrator_workflows", workflowId, {
      status: command === "pause" ? "paused" : command === "resume" ? "active" : "cancelled",
      blocked_reason: command === "pause" ? clean(payload.reason || "Paused by founder authority") : null,
      completed_at: command === "cancel" ? now() : null,
      next_action: command === "resume" ? "Resume orchestrated processing" : command === "cancel" ? "Workflow cancelled" : "Await founder resume decision",
    });
    return { workflow };
  }
  if (action === "dead-letter-retry") {
    const supabase = await createServiceClient();
    const deadLetterId = clean(payload.deadLetterId);
    if (!deadLetterId) throw new Error("DEAD_LETTER_REQUIRED");
    const dead = await maybe(supabase, "ac_capital_dead_letters", "id", deadLetterId);
    if (!dead) throw new Error("DEAD_LETTER_NOT_FOUND");
    if (dead.event_id) await update(supabase, "ac_capital_orchestrator_events", clean(dead.event_id), { status: "queued", attempts: 0, available_at: now(), locked_at: null, locked_by: null, error_code: null, error_message: null });
    const reopened = await update(supabase, "ac_capital_dead_letters", deadLetterId, { status: "requeued", resolved_at: now(), resolution_note: clean(payload.note || "Requeued by operator") });
    return { deadLetter: reopened };
  }
  if (action === "artifact-approval") {
    const supabase = await createServiceClient();
    const artifactId = clean(payload.artifactId);
    const decision = clean(payload.decision);
    if (!artifactId || !["pending", "approved", "rejected"].includes(decision)) throw new Error("VALID_ARTIFACT_APPROVAL_REQUIRED");
    const current = await maybe(supabase, "ac_capital_artifacts", "id", artifactId);
    if (!current) throw new Error("ARTIFACT_NOT_FOUND");
    const artifact = await update(supabase, "ac_capital_artifacts", artifactId, {
      approval_status: decision,
      status: decision === "approved" ? "approved-immutable-snapshot" : decision === "pending" ? "awaiting-founder-approval" : "rejected-rework",
      approved_by: decision === "approved" ? actorName(actor) : null,
      approved_at: decision === "approved" ? now() : null,
      approved_version: decision === "approved" ? Number(payload.version || current.current_version || 1) : null,
      immutable_snapshot_hash: decision === "approved" ? snapshotHash(object(current.content_snapshot)) : null,
    });
    return { artifact };
  }
  throw new Error(`UNSUPPORTED_ORCHESTRATOR_ACTION:${action}`);
}
