import { apiError, envelope, insertAudit, insertRow, isFounder, isWriter, readTable, requiredString, requireCapitalApiActor, success, updateRow } from "@/lib/ac-capital-os/server/mz15-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCapitalApiActor();
    const [dossiers, criteria, scores, decisions, risks, missingDocuments, nextActions] = await Promise.all([
      readTable("ac_capital_qualification_dossiers", 200), readTable("ac_capital_qualification_criteria", 100),
      readTable("ac_capital_qualification_scores", 400), readTable("ac_capital_qualification_decisions", 200),
      readTable("ac_capital_qualification_risks", 300), readTable("ac_capital_qualification_missing_documents", 300),
      readTable("ac_capital_qualification_next_actions", 300),
    ]);
    return Response.json(envelope({ dossiers, criteria, scores, decisions, risks, missingDocuments, nextActions }));
  } catch (reason) { return apiError(reason); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor(); if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    const body = await request.json() as Record<string, unknown>; const action = String(body.action || "create-dossier");
    if (action === "create-dossier") {
      const record = await insertRow("ac_capital_qualification_dossiers", {
        radar_opportunity_id: body.radarOpportunityId || null, title: requiredString(body.title, "Dossier title"),
        opportunity_type: requiredString(body.opportunityType, "Opportunity type"), country: body.country || null, region: body.region || null,
        source_confidence: Number(body.sourceConfidence || 0), total_score: Number(body.totalScore || 0), decision_label: body.decisionLabel || "Needs Proof",
        ai_confidence: Number(body.aiConfidence || 0), status: "under-review", priority: body.priority || "medium", deadline: body.deadline || null,
        deadline_risk: body.deadlineRisk || null, documentation_readiness: Number(body.documentationReadiness || 0),
        founder_review_required: Boolean(body.founderReviewRequired), recommended_owner: body.owner || actor.name, next_action: body.nextAction || "Complete qualification review",
        executive_summary: body.executiveSummary || null, eligibility_summary: body.eligibilitySummary || null,
        angelcare_match_summary: body.angelcareMatchSummary || null, strategic_exception: body.strategicException || null,
      });
      await insertAudit({ actor: actor.email || actor.name, action, objectType: "qualification_dossier", objectId: String(record.id), after: record });
      return Response.json(success({ record }));
    }
    const dossierId = requiredString(body.dossierId, "Dossier id");
    if (action === "decision") {
      const decision = requiredString(body.decisionLabel, "Decision");
      const founderRequired = Boolean(body.founderReviewRequired) || decision === "Needs Founder Review";
      if (founderRequired && ["Pursue", "Approved"].includes(decision) && !isFounder(actor)) throw Object.assign(new Error("FOUNDER_APPROVAL_REQUIRED"), { status: 403 });
      const record = await insertRow("ac_capital_qualification_decisions", { dossier_id: dossierId, decision_label: decision, decision_reason: body.reason || null, decided_by: actor.email || actor.name, founder_review_required: founderRequired, status: founderRequired ? "pending-founder-review" : "recorded" });
      const dossier = await updateRow("ac_capital_qualification_dossiers", dossierId, { decision_label: decision, status: decision.toLowerCase().replaceAll(" ", "-"), founder_review_required: founderRequired, next_action: body.nextAction || null });
      await insertAudit({ actor: actor.email || actor.name, action, objectType: "qualification_decision", objectId: String(record.id), after: { record, dossier }, approval: founderRequired ? "Founder approval" : "Human review" });
      return Response.json(success({ record, dossier }));
    }
    if (action === "missing-document") {
      const record = await insertRow("ac_capital_qualification_missing_documents", { dossier_id: dossierId, document_name: requiredString(body.documentName, "Document name"), document_category: body.category || null, status: "Missing", priority: body.priority || "medium", required_for_submission: body.requiredForSubmission !== false, owner: body.owner || actor.name, due_date: body.dueDate || null });
      return Response.json(success({ record }));
    }
    if (action === "next-action") {
      const record = await insertRow("ac_capital_qualification_next_actions", { dossier_id: dossierId, action_label: requiredString(body.actionLabel, "Action label"), why: body.why || null, owner: body.owner || actor.name, priority: body.priority || "medium", deadline: body.deadline || null, expected_output: body.expectedOutput || null, related_workspace: body.relatedWorkspace || "qualification", status: "open" });
      return Response.json(success({ record }));
    }
    throw Object.assign(new Error("UNSUPPORTED_QUALIFICATION_ACTION"), { status: 400 });
  } catch (reason) { return apiError(reason); }
}
