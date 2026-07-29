import {
  apiError,
  envelope,
  insertAudit,
  insertRow,
  isFounder,
  isWriter,
  readTable,
  requiredString,
  requireCapitalApiActor,
  success,
  updateRow,
} from "@/lib/ac-capital-os/server/mz15-api";
import { evaluateStageGates } from "@/lib/ac-capital-os/server/institutional-runtime";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const now = () => new Date().toISOString();
const clean = (value: unknown) => String(value ?? "").trim();

async function emitPipelineEvent(input: {
  eventType: string;
  pipelineId: string;
  payload?: Record<string, unknown>;
}) {
  const supabase = await createServiceClient();
  const fingerprint = `${input.eventType}:${input.pipelineId}:${JSON.stringify(input.payload || {})}`;
  const result = await supabase
    .from("ac_capital_orchestrator_events")
    .insert({
      event_type: input.eventType,
      entity_type: "pipeline",
      entity_id: input.pipelineId,
      source_workspace: "pipeline",
      status: "queued",
      payload: input.payload || {},
      idempotency_key: fingerprint,
      available_at: now(),
      updated_at: now(),
    })
    .select("*")
    .single();
  if (result.error && !String(result.error.message).toLowerCase().includes("duplicate")) {
    throw result.error;
  }
  return result.data || null;
}

export async function GET() {
  try {
    await requireCapitalApiActor();
    const [
      records,
      stageEvents,
      gateEvaluations,
      followups,
      tasks,
      communications,
      submissions,
      submissionProofs,
      dueDiligenceRequests,
      negotiations,
      outcomes,
      learningItems,
      calendarEvents,
      auditEvents,
    ] = await Promise.all([
      readTable("ac_capital_pipeline_records", 250),
      readTable("ac_capital_pipeline_stage_events", 500, "changed_at"),
      readTable("ac_capital_stage_gate_evaluations", 500, "evaluated_at"),
      readTable("ac_capital_pipeline_followups", 400),
      readTable("ac_capital_pipeline_tasks", 400),
      readTable("ac_capital_pipeline_communications", 500),
      readTable("ac_capital_pipeline_submissions", 300),
      readTable("ac_capital_submission_proofs", 300),
      readTable("ac_capital_pipeline_due_diligence_requests", 300),
      readTable("ac_capital_pipeline_negotiations", 300),
      readTable("ac_capital_pipeline_outcomes", 300),
      readTable("ac_capital_pipeline_learning_items", 300),
      readTable("ac_capital_pipeline_calendar_events", 300),
      readTable("ac_capital_pipeline_audit_events", 500),
    ]);
    return Response.json(
      envelope({
        records,
        stageEvents,
        gateEvaluations,
        followups,
        tasks,
        communications,
        submissions,
        submissionProofs,
        dueDiligenceRequests,
        negotiations,
        outcomes,
        learningItems,
        calendarEvents,
        auditEvents,
      }),
    );
  } catch (reason) {
    return apiError(reason);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) {
      throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    }
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "create-deal");

    if (action === "create-deal") {
      const record = await insertRow("ac_capital_pipeline_records", {
        opportunity_id: body.opportunityId || null,
        qualification_dossier_id: body.qualificationDossierId || null,
        funder_id: body.funderId || null,
        case_id: body.caseId || null,
        data_room_package_id: body.dataRoomPackageId || null,
        title: requiredString(body.title, "Deal title"),
        stage: body.stage || "Detected",
        status: "Active",
        funding_type: body.fundingType || null,
        package_type: body.packageType || null,
        estimated_amount_min: body.amountMin || null,
        estimated_amount_max: body.amountMax || null,
        currency_label: body.currencyLabel || "Dh",
        weighted_value: body.weightedValue || null,
        probability_percent: Number(body.probabilityPercent || 0),
        deadline: body.deadline || null,
        next_action: body.nextAction || "Complete transaction setup",
        next_action_due_date: body.nextActionDueDate || null,
        owner: body.owner || actor.name,
        priority: body.priority || "medium",
        relationship_temperature: body.relationshipTemperature || "Cold",
        risk_level: body.riskLevel || "Medium",
        readiness_score: Number(body.readinessScore || 0),
        founder_approval_status: "not_started",
        data_room_readiness_score: Number(body.dataRoomReadinessScore || 0),
      });
      const event = await emitPipelineEvent({
        eventType: "pipeline.created",
        pipelineId: String(record.id),
        payload: { caseId: record.case_id || null, stage: record.stage },
      });
      await insertAudit({
        actor: actor.email || actor.name,
        action,
        objectType: "pipeline_record",
        objectId: String(record.id),
        after: record,
      });
      return Response.json(success({ record, event }));
    }

    const pipelineId = requiredString(body.pipelineRecordId, "Pipeline record id");

    if (action === "evaluate-stage") {
      const requestedStage = requiredString(body.newStage, "New stage");
      const gate = await evaluateStageGates({
        entityType: "pipeline",
        entityId: pipelineId,
        workspaceKey: "pipeline",
        requestedStage,
        actor,
      });
      return Response.json(success({ gate }));
    }

    if (action === "move-stage") {
      const nextStage = requiredString(body.newStage, "New stage");
      if (["Approved", "Negotiation", "Submitted"].includes(nextStage) && Boolean(body.founderApprovalRequired) && !isFounder(actor)) {
        throw Object.assign(new Error("FOUNDER_APPROVAL_REQUIRED"), { status: 403 });
      }
      const gate = await evaluateStageGates({
        entityType: "pipeline",
        entityId: pipelineId,
        workspaceKey: "pipeline",
        requestedStage: nextStage,
        actor,
      });
      if (!gate.passed) {
        throw Object.assign(
          new Error(`AC_CAPITAL_STAGE_GATE_BLOCKED:${nextStage}:${JSON.stringify(gate.blockers)}`),
          { status: 409, blockers: gate.blockers },
        );
      }
      const event = await insertRow("ac_capital_pipeline_stage_events", {
        pipeline_record_id: pipelineId,
        previous_stage: body.previousStage || null,
        new_stage: nextStage,
        changed_by: actor.email || actor.name,
        reason: body.reason || null,
        evidence_reference: body.evidenceReference || body.proofReference || null,
        comments: body.comments || null,
      });
      const record = await updateRow("ac_capital_pipeline_records", pipelineId, {
        stage: nextStage,
        last_activity_at: now(),
        next_action: body.nextAction || null,
      });
      const orchestratorEvent = await emitPipelineEvent({
        eventType: "pipeline.updated",
        pipelineId,
        payload: {
          previousStage: body.previousStage || null,
          newStage: nextStage,
          gateEvaluationId: gate.evaluation.id,
          recordVersion: record.record_version || 1,
        },
      });
      await insertAudit({
        actor: actor.email || actor.name,
        action: "pipeline_stage_transition",
        objectType: "pipeline_record",
        objectId: pipelineId,
        after: record,
        reason: clean(body.reason) || `Stage moved to ${nextStage}`,
        approval: "Stage-gate evaluation",
      });
      return Response.json(success({ event, record, gate, orchestratorEvent }));
    }

    if (action === "followup") {
      const record = await insertRow("ac_capital_pipeline_followups", {
        pipeline_record_id: pipelineId,
        followup_type: body.followupType || "Follow-up",
        channel: body.channel || "Email",
        recipient_name: body.recipientName || null,
        recipient_role: body.recipientRole || null,
        due_date: body.dueDate || null,
        priority: body.priority || "medium",
        status: "Planned",
        script_available: Boolean(body.scriptAvailable),
        documents_needed: Array.isArray(body.documentsNeeded) ? body.documentsNeeded : [],
        risk_if_missed: body.riskIfMissed || null,
        owner: body.owner || actor.name,
      });
      return Response.json(success({ record }));
    }

    if (action === "communication") {
      const record = await insertRow("ac_capital_pipeline_communications", {
        pipeline_record_id: pipelineId,
        channel: requiredString(body.channel, "Channel"),
        contact_person: body.contactPerson || null,
        subject: body.subject || null,
        summary: body.summary || null,
        outcome: body.outcome || null,
        next_action: body.nextAction || null,
        proof_reference: body.proofReference || null,
        occurred_at: body.occurredAt || now(),
        logged_by: actor.email || actor.name,
      });
      return Response.json(success({ record }));
    }

    if (action === "submission") {
      const proofReference = requiredString(body.proofReference, "Submission proof");
      const recipient = requiredString(body.recipient, "Recipient");
      const supabase = await createServiceClient();
      const result = await supabase.rpc("ac_capital_ic10_record_submission", {
        p_pipeline_record_id: pipelineId,
        p_case_id: body.caseId || null,
        p_approval_id: body.approvalId || null,
        p_recipient: recipient,
        p_method: body.method || "Manual",
        p_proof_reference: proofReference,
        p_proof_type: body.proofType || "manual-evidence",
        p_documents: Array.isArray(body.documentsIncluded) ? body.documentsIncluded : [],
        p_submitted_by: actor.email || actor.name,
        p_submitted_at: body.submittedAt || now(),
        p_coordinator_task_id: body.coordinatorTaskId || null,
        p_confirmation_received: Boolean(body.confirmationReceived),
      });
      if (result.error) throw result.error;
      const payload = (result.data || {}) as Record<string, unknown>;
      await insertAudit({
        actor: actor.email || actor.name,
        action: "submission_proof_recorded",
        objectType: "pipeline_record",
        objectId: pipelineId,
        after: payload,
        reason: "Authorized human submission evidence recorded atomically.",
        approval: "Exact-version approval + proof-controlled external completion",
      });
      return Response.json(success(payload));
    }

    if (action === "negotiation") {
      const record = await insertRow("ac_capital_pipeline_negotiations", {
        pipeline_record_id: pipelineId,
        amount_discussed: body.amountDiscussed || null,
        instrument_type: body.instrumentType || null,
        terms_requested: body.termsRequested || null,
        repayment_terms: body.repaymentTerms || null,
        equity_dilution_note: body.equityDilutionNote || null,
        guarantee_requirement: body.guaranteeRequirement || null,
        documents_required: Array.isArray(body.documentsRequired) ? body.documentsRequired : [],
        founder_review_required: Boolean(body.founderReviewRequired),
        risk_note: body.riskNote || null,
        negotiation_status: body.negotiationStatus || "In Discussion",
        next_meeting: body.nextMeeting || null,
        decision_owner: body.decisionOwner || actor.name,
      });
      return Response.json(success({ record }));
    }

    if (action === "outcome") {
      const outcomeLabel = requiredString(body.outcome, "Outcome");
      const record = await insertRow("ac_capital_pipeline_outcomes", {
        pipeline_record_id: pipelineId,
        outcome: outcomeLabel,
        reason: body.reason || null,
        funder_feedback: body.funderFeedback || null,
        missing_proof_identified: body.missingProof || null,
        objection_learned: body.objectionLearned || null,
        document_weakness: body.documentWeakness || null,
        next_improvement: body.nextImprovement || null,
        doctrine_update_needed: Boolean(body.doctrineUpdateNeeded),
        data_room_update_needed: Boolean(body.dataRoomUpdateNeeded),
        qualification_score_adjustment_needed: Boolean(body.qualificationUpdateNeeded),
        future_relationship_action: body.futureRelationshipAction || null,
        status: "Recorded",
      });
      const learning = await insertRow("ac_capital_pipeline_learning_items", {
        pipeline_record_id: pipelineId,
        outcome: outcomeLabel,
        reason: body.reason || null,
        objection_learned: body.objectionLearned || null,
        missing_proof: body.missingProof || null,
        doctrine_update_needed: Boolean(body.doctrineUpdateNeeded),
        data_room_update_needed: Boolean(body.dataRoomUpdateNeeded),
        qualification_update_needed: Boolean(body.qualificationUpdateNeeded),
        next_recommendation: body.nextImprovement || null,
        status: "Pending Doctrine Review",
      });
      const orchestratorEvent = await emitPipelineEvent({
        eventType: "outcome.recorded",
        pipelineId,
        payload: { outcomeId: record.id, outcome: outcomeLabel },
      });
      return Response.json(success({ record, learning, orchestratorEvent }));
    }

    throw Object.assign(new Error("UNSUPPORTED_PIPELINE_ACTION"), { status: 400 });
  } catch (reason) {
    return apiError(reason);
  }
}
