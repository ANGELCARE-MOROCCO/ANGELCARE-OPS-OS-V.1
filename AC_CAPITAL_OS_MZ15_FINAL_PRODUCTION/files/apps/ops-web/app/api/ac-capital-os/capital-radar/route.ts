import { apiError, envelope, insertAudit, insertRow, isFounder, isWriter, readTable, requiredString, requireCapitalApiActor, success, updateRow } from "@/lib/ac-capital-os/server/mz15-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCapitalApiActor();
    const [opportunities, sources, researchRuns, handoffQueue, opportunityTags] = await Promise.all([
      readTable("ac_capital_radar_opportunities", 200),
      readTable("ac_capital_radar_sources", 100),
      readTable("ac_capital_radar_research_runs", 100, "started_at"),
      readTable("ac_capital_radar_handoff_queue", 100),
      readTable("ac_capital_radar_opportunity_tags", 200),
    ]);
    return Response.json(envelope({ opportunities, sources, researchRuns, handoffQueue, opportunityTags }));
  } catch (reason) { return apiError(reason); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action || "create-opportunity");
    if (action === "create-opportunity") {
      let sourceId: string | null = null;
      const sourceName = String(body.sourceName || "").trim();
      if (sourceName) {
        const source = await insertRow("ac_capital_radar_sources", {
          source_name: sourceName,
          source_url: body.sourceUrl || null,
          source_type: body.sourceType || "web",
          country: body.country || null,
          region: body.region || null,
          source_confidence: Number(body.sourceConfidence || 50),
          verification_status: "needs_review",
          notes: body.sourceNotes || null,
        });
        sourceId = String(source.id);
      }
      const record = await insertRow("ac_capital_radar_opportunities", {
        title: requiredString(body.title, "Opportunity title"),
        opportunity_type: requiredString(body.opportunityType, "Opportunity type"),
        country: body.country || null,
        region: body.region || null,
        amount_min: body.amountMin || null,
        amount_max: body.amountMax || null,
        amount_range_label: body.amountRangeLabel || null,
        currency_label: body.currencyLabel || "Dh",
        deadline: body.deadline || null,
        deadline_label: body.deadlineLabel || null,
        deadline_heat: body.deadlineHeat || "unknown",
        source_id: sourceId,
        source_url: body.sourceUrl || null,
        source_name: sourceName || body.sourceName || null,
        source_confidence: Number(body.sourceConfidence || 50),
        eligibility_preview: body.eligibilityPreview || null,
        angelcare_relevance_preview: body.angelcareRelevancePreview || null,
        detected_by: actor.name,
        why_captured: body.whyCaptured || null,
        status: "detected",
        handoff_status: "not-ready",
      });
      await insertAudit({ actor: actor.email || actor.name, action, objectType: "radar_opportunity", objectId: String(record.id), after: record, reason: "Manual opportunity captured" });
      return Response.json(success({ record }));
    }
    const id = requiredString(body.id, "Opportunity id");
    if (action === "validate-source") {
      const record = await updateRow("ac_capital_radar_opportunities", id, {
        source_confidence: Number(body.sourceConfidence || 70),
        status: body.valid === false ? "source-review" : "ready-for-qualification",
        handoff_status: body.valid === false ? "needs-human-confirmation" : "ready-for-qualification",
        source_url: body.sourceUrl || undefined,
        source_name: body.sourceName || undefined,
      });
      await insertAudit({ actor: actor.email || actor.name, action, objectType: "radar_opportunity", objectId: id, after: record, reason: String(body.reviewNote || "Source reviewed") });
      return Response.json(success({ record }));
    }
    if (action === "handoff") {
      const handoff = await insertRow("ac_capital_radar_handoff_queue", {
        opportunity_id: id,
        target_workspace: "qualification-engine",
        handoff_status: "pending",
        coordinator_instruction: body.instruction || "Review source, eligibility and AngelCare fit.",
        created_by: actor.email || actor.name,
      });
      const record = await updateRow("ac_capital_radar_opportunities", id, { status: "ready-for-qualification", handoff_status: "ready-for-qualification" });
      await insertAudit({ actor: actor.email || actor.name, action, objectType: "radar_handoff", objectId: String(handoff.id), after: { handoff, record } });
      return Response.json(success({ handoff, record }));
    }
    if (["monitor", "reject"].includes(action)) {
      const record = await updateRow("ac_capital_radar_opportunities", id, { status: action === "monitor" ? "watchlist" : "rejected", why_captured: body.reason || null });
      await insertAudit({ actor: actor.email || actor.name, action, objectType: "radar_opportunity", objectId: id, after: record, reason: String(body.reason || action) });
      return Response.json(success({ record }));
    }
    throw Object.assign(new Error("UNSUPPORTED_RADAR_ACTION"), { status: 400 });
  } catch (reason) { return apiError(reason); }
}
