import { executeGroundedCapitalResearch } from "@/lib/ac-capital-os/server/live-intelligence";
import { persistExternalResearchExecution } from "@/lib/ac-capital-os/server/free-provider-persistence";
import { apiError, insertAudit, insertRow, isWriter, requireCapitalApiActor, success, updateRow } from "@/lib/ac-capital-os/server/mz15-api";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export async function POST(request: Request) {
  let radarRunId: string | null = null;
  let providerLogId: string | null = null;
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    const body = await request.json() as Row;
    const query = String(body.query || "AngelCare funding opportunities").trim();
    const agentKey = String(body.agentKey || "funding-opportunity-radar").trim();
    if (!query) throw Object.assign(new Error("Research query is required."), { status: 400 });

    const startedAt = new Date().toISOString();
    const radarRun = await insertRow("ac_capital_radar_research_runs", {
      run_label: `External public research: ${query}`,
      adapter_name: "AC Capital Tavily Search + OpenRouter Free Analysis",
      adapter_mode: "web-ready",
      status: "running",
      opportunities_detected: 0,
      sources_captured: 0,
      failed_sources: 0,
      human_review_required: 0,
      started_at: startedAt,
      safety_note: "Tavily retrieves public web evidence. OpenRouter analyzes it. External actions remain locked.",
      research_query: query,
    });
    radarRunId = String(radarRun.id);

    const providerLog = await insertRow("ac_capital_provider_execution_logs", {
      provider_authority: "/ac-capital-os/ai-control",
      module_key: "ac_capital_os",
      agent_key: agentKey,
      execution_mode: "external-public-research",
      provider_mode: "tavily-openrouter",
      live_run_allowed: true,
      request_payload: { query, radarRunId, agentKey, actorId: actor.id || null },
      status: "running",
      warning: null,
    });
    providerLogId = String(providerLog.id);

    const execution = await executeGroundedCapitalResearch({ query, actorId: actor.id || null, agentKey });
    const persistence = await persistExternalResearchExecution(execution.execution, { radarRunId, actorId: actor.id || null });

    const sources = persistence.persistedSources;
    const opportunities = persistence.createdOpportunities;
    const rejections = persistence.rejectedSignals;
    const completedRun = await updateRow("ac_capital_radar_research_runs", radarRunId, {
      status: "completed",
      opportunities_detected: opportunities.length,
      sources_captured: sources.length,
      failed_sources: 0,
      human_review_required: opportunities.length + rejections.length,
      finished_at: new Date().toISOString(),
      safety_note: "Public web research and free-provider analysis completed. Internal records were created only where the agent permissions allowed. Human review remains required before external action.",
      provider_request_id: execution.execution.tavilyRequestId,
      provider_response_id: execution.execution.openRouterRequestId,
      provider_model: execution.execution.selectedAnalysisModel,
      input_tokens: execution.execution.inputTokens,
      output_tokens: execution.execution.outputTokens,
      estimated_cost_usd: 0,
      grounding_queries: execution.execution.searchQueries,
      grounding_metadata: {
        searchProvider: "tavily",
        analysisProvider: "openrouter",
        freeProviderRunId: execution.execution.runId,
        tavilyCredits: execution.execution.tavilyCredits,
        sourceCount: execution.execution.sources.length,
        selectedAnalysisModel: execution.execution.selectedAnalysisModel,
      },
    });

    if (providerLogId) {
      await updateRow("ac_capital_provider_execution_logs", providerLogId, {
        status: "completed",
        response_payload: {
          freeProviderRunId: execution.execution.runId,
          tavilyRequestId: execution.execution.tavilyRequestId,
          openRouterRequestId: execution.execution.openRouterRequestId,
          selectedAnalysisModel: execution.execution.selectedAnalysisModel,
          usage: execution.usage,
          summary: execution.result.summary,
          confidence: execution.result.confidence,
          searchQueries: execution.execution.searchQueries,
          sourceCount: sources.length,
          opportunityCount: opportunities.length,
          rejectionCount: rejections.length,
          duplicateCount: persistence.duplicateCount,
          internalActions: persistence.internalActions,
        },
        warning: null,
      });
    }

    const result = {
      query,
      agentKey,
      run: completedRun,
      freeProviderRunId: execution.execution.runId,
      providers: { search: "tavily", analysis: "openrouter" },
      selectedAnalysisModel: execution.execution.selectedAnalysisModel,
      usage: execution.usage,
      summary: execution.result.summary,
      confidence: execution.result.confidence,
      searchQueries: execution.execution.searchQueries,
      sources,
      opportunities,
      rejections,
      duplicateCount: persistence.duplicateCount,
      internalActions: persistence.internalActions,
      affectedRecords: sources.length + opportunities.length + rejections.length + 1,
      requiresHumanReview: true,
      externalActionsLocked: true,
    };
    await insertAudit({
      actor: actor.email || actor.name,
      action: "radar_external_public_research_run",
      objectType: "research_run",
      objectId: radarRunId,
      after: result,
      risk: "Medium",
      approval: "Human source and qualification review",
    });
    return Response.json(success(result));
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : String(reason);
    if (providerLogId) {
      try {
        await updateRow("ac_capital_provider_execution_logs", providerLogId, {
          status: "failed",
          response_payload: null,
          warning: message,
        });
      } catch { /* preserve original failure */ }
    }
    if (radarRunId) {
      try {
        await updateRow("ac_capital_radar_research_runs", radarRunId, {
          status: "failed",
          finished_at: new Date().toISOString(),
          safety_note: `External public research failed safely: ${message}`,
          error_message: message,
        });
      } catch { /* preserve original failure */ }
    }
    return apiError(reason);
  }
}
