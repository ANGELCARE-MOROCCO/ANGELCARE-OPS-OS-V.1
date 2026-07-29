import { executeGroundedCapitalResearch } from "@/lib/ac-capital-os/server/live-intelligence";
import { apiError, insertAudit, insertRow, isWriter, readTable, requireCapitalApiActor, success, updateRow } from "@/lib/ac-capital-os/server/mz15-api";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

function opportunityKey(title: unknown, sourceUrl: unknown) {
  return `${String(title || "").trim().toLowerCase()}::${String(sourceUrl || "").trim().toLowerCase()}`;
}

export async function POST(request: Request) {
  let runId: string | null = null;
  let providerLogId: string | null = null;
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    const body = await request.json() as Row;
    const query = String(body.query || "AngelCare funding opportunities").trim();
    if (!query) throw Object.assign(new Error("Research query is required."), { status: 400 });

    const startedAt = new Date().toISOString();
    const run = await insertRow("ac_capital_radar_research_runs", {
      run_label: `Live grounded research: ${query}`,
      adapter_name: "AC Capital Governed Gemini Google Search Adapter",
      adapter_mode: "gemini-ready",
      status: "running",
      opportunities_detected: 0,
      sources_captured: 0,
      failed_sources: 0,
      human_review_required: 0,
      started_at: startedAt,
      safety_note: "Live governed provider execution started. Success requires a provider request and Google Search grounding metadata.",
      research_query: query,
    });
    runId = String(run.id);

    const providerLog = await insertRow("ac_capital_provider_execution_logs", {
      provider_authority: "/ai-provider-control",
      module_key: "ac_capital_os",
      agent_key: "capital-radar",
      execution_mode: "live-grounded",
      provider_mode: "provider-control",
      live_run_allowed: true,
      request_payload: { query, researchRunId: runId, actorId: actor.id || null },
      status: "running",
      warning: null,
    });
    providerLogId = String(providerLog.id);

    const execution = await executeGroundedCapitalResearch({ query, actorId: actor.id || null });
    const existingSources = await readTable("ac_capital_radar_sources", 500);
    const sourceByUrl = new Map(existingSources.map((row) => [String(row.source_url || ""), row]));
    const persistedSources: Row[] = [];

    for (const source of execution.result.sources) {
      let sourceRow = sourceByUrl.get(source.url);
      if (!sourceRow) {
        sourceRow = await insertRow("ac_capital_radar_sources", {
          source_name: source.title,
          source_url: source.url,
          source_type: "gemini-google-search-grounding",
          country: null,
          region: null,
          source_confidence: 70,
          verification_status: "grounded-needs-review",
          notes: `Captured from governed research ${execution.requestId}. Human verification remains required.`,
          research_run_id: runId,
          provider_request_id: execution.requestId,
          grounding_chunk_index: source.index,
        });
        sourceByUrl.set(source.url, sourceRow);
      }
      persistedSources.push(sourceRow);
    }

    const existingOpportunities = await readTable("ac_capital_radar_opportunities", 500);
    const existingKeys = new Set(existingOpportunities.map((row) => opportunityKey(row.title, row.source_url)));
    const createdOpportunities: Row[] = [];
    const rejectedSignals: Row[] = [];

    for (const candidate of execution.result.opportunities) {
      const key = opportunityKey(candidate.title, candidate.sourceUrl);
      const sourceRow = sourceByUrl.get(candidate.sourceUrl);
      if (existingKeys.has(key)) {
        rejectedSignals.push(await insertRow("ac_capital_radar_rejections", {
          research_run_id: runId,
          candidate_title: candidate.title,
          source_name: candidate.sourceTitle,
          source_url: candidate.sourceUrl,
          rejection_reason: "Duplicate opportunity already exists in Capital Radar.",
          provider_request_id: execution.requestId,
          metadata: candidate,
        }));
        continue;
      }
      const opportunity = await insertRow("ac_capital_radar_opportunities", {
        title: candidate.title,
        opportunity_type: candidate.opportunityType,
        country: candidate.country,
        region: candidate.region,
        amount_min: candidate.amountMin,
        amount_max: candidate.amountMax,
        amount_range_label: candidate.amountRangeLabel,
        currency_label: candidate.currencyLabel || "Dh",
        deadline: candidate.deadline,
        deadline_label: candidate.deadlineLabel,
        deadline_heat: candidate.deadlineHeat,
        source_id: sourceRow?.id || null,
        source_url: candidate.sourceUrl,
        source_name: candidate.sourceTitle,
        source_confidence: candidate.sourceConfidence,
        eligibility_preview: candidate.eligibilityPreview,
        angelcare_relevance_preview: candidate.angelcareRelevancePreview,
        detected_by: "AC Capital Governed Gemini Google Search",
        why_captured: candidate.whyCaptured,
        status: "source-review",
        handoff_status: "needs-human-confirmation",
        research_run_id: runId,
        provider_request_id: execution.requestId,
        grounding_chunk_index: candidate.sourceIndex,
        grounding_metadata: { searchQueries: execution.result.searchQueries, providerResponseId: execution.result.providerResponseId },
      });
      createdOpportunities.push(opportunity);
      existingKeys.add(key);
    }

    for (const rejected of execution.result.rejectedSignals) {
      rejectedSignals.push(await insertRow("ac_capital_radar_rejections", {
        research_run_id: runId,
        candidate_title: rejected.title,
        source_name: rejected.sourceTitle,
        source_url: rejected.sourceUrl,
        rejection_reason: rejected.reason,
        provider_request_id: execution.requestId,
        metadata: rejected,
      }));
    }

    const completedRun = await updateRow("ac_capital_radar_research_runs", runId, {
      status: "completed",
      opportunities_detected: createdOpportunities.length,
      sources_captured: persistedSources.length,
      failed_sources: rejectedSignals.filter((row) => /source/i.test(String(row.rejection_reason || ""))).length,
      human_review_required: createdOpportunities.length + rejectedSignals.length,
      finished_at: new Date().toISOString(),
      safety_note: "Live Gemini Google Search grounding executed. Sources and candidates were persisted for human review; no qualification, outreach or submission was automated.",
      provider_request_id: execution.requestId,
      provider_response_id: execution.result.providerResponseId,
      provider_model: execution.result.providerModelVersion || execution.model,
      input_tokens: execution.usage.inputTokens,
      output_tokens: execution.usage.outputTokens,
      estimated_cost_usd: execution.usage.estimatedCostUsd,
      grounding_queries: execution.result.searchQueries,
      grounding_metadata: { sources: execution.result.sources, responseId: execution.result.providerResponseId },
    });

    if (providerLogId) {
      await updateRow("ac_capital_provider_execution_logs", providerLogId, {
        status: "completed",
        response_payload: {
          requestId: execution.requestId,
          provider: execution.providerType,
          model: execution.model,
          usage: execution.usage,
          summary: execution.result.summary,
          confidence: execution.result.confidence,
          searchQueries: execution.result.searchQueries,
          sourceCount: persistedSources.length,
          opportunityCount: createdOpportunities.length,
          rejectionCount: rejectedSignals.length,
        },
        warning: null,
      });
    }

    const result = {
      query,
      run: completedRun,
      requestId: execution.requestId,
      provider: execution.providerType,
      model: execution.model,
      usage: execution.usage,
      summary: execution.result.summary,
      confidence: execution.result.confidence,
      searchQueries: execution.result.searchQueries,
      sources: persistedSources,
      opportunities: createdOpportunities,
      rejections: rejectedSignals,
      affectedRecords: persistedSources.length + createdOpportunities.length + rejectedSignals.length + 1,
      requiresHumanReview: true,
    };
    await insertAudit({
      actor: actor.email || actor.name,
      action: "radar_grounded_research_run",
      objectType: "research_run",
      objectId: runId,
      after: result,
      risk: "Medium",
      approval: "Human source and qualification review",
    });
    return Response.json(success(result));
  } catch (reason) {
    if (providerLogId) {
      try {
        await updateRow("ac_capital_provider_execution_logs", providerLogId, {
          status: "failed",
          response_payload: null,
          warning: reason instanceof Error ? reason.message : String(reason),
        });
      } catch { /* preserve the original failure */ }
    }
    if (runId) {
      try {
        await updateRow("ac_capital_radar_research_runs", runId, {
          status: "failed",
          finished_at: new Date().toISOString(),
          safety_note: `Grounded research failed safely: ${reason instanceof Error ? reason.message : String(reason)}`,
          error_message: reason instanceof Error ? reason.message : String(reason),
        });
      } catch { /* preserve the original failure */ }
    }
    return apiError(reason);
  }
}
