import { executeAcCapitalGovernedAi } from "@/lib/ac-capital-os/server/ai-provider-bridge";
import { apiError, insertAudit, insertRow, isWriter, readTable, requireCapitalApiActor, success, updateRow } from "@/lib/ac-capital-os/server/mz15-api";

export const dynamic = "force-dynamic";

function approved(value: unknown) {
  return /approved|validated|founder approved/i.test(String(value || ""));
}

function defaultPrompt() {
  return "Analyze the current AC CAPITAL OS context and produce a source-aware capital readiness brief. Separate confirmed facts, missing evidence, risks, recommendations and required human actions. Do not perform any external action.";
}

export async function POST(request: Request) {
  let runId: string | null = null;
  try {
    const actor = await requireCapitalApiActor();
    if (!isWriter(actor)) throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"), { status: 403 });
    const body = await request.json() as Record<string, unknown>;
    const agents = await readTable("ac_capital_ai_agents", 200);
    const agent = agents.find((item) => String(item.id) === String(body.agentId) || String(item.agent_key) === String(body.agentKey)) || null;
    const riskLevel = String(body.riskLevel || "Medium");
    const approvalStatus = String(body.approvalStatus || "Human Review Required");
    const prompt = String(body.prompt || "").trim() || defaultPrompt();
    const doctrineUsed = Array.isArray(body.doctrineUsed) ? body.doctrineUsed.map(String) : [];

    if (/financial sensitive/i.test(riskLevel) && !approved(approvalStatus)) {
      throw Object.assign(new Error("FOUNDER_APPROVAL_REQUIRED_FOR_FINANCIAL_SENSITIVE_AI"), { status: 403 });
    }

    const record = await insertRow("ac_capital_ai_agent_runs", {
      agent_id: agent?.id || null,
      agent_key: agent?.agent_key || body.agentKey || "ac-capital-intelligence-director",
      workspace: body.workspace || "AI Command Center",
      input_source: "AC Capital governed OpenRouter runtime",
      doctrine_used: doctrineUsed,
      prompt_used: prompt,
      skill_used: body.skill || null,
      output_type: "governed_openrouter_result",
      confidence: Number(body.confidence || 70),
      risk_level: riskLevel,
      human_approval_status: approvalStatus,
      status: "Provider Execution Running",
      phase: "analysis",
      trigger_type: "manual",
      created_by: actor.email || actor.name,
      actor_id: actor.id || null,
      started_at: new Date().toISOString(),
    });
    runId = String(record.id);

    const providerResult = await executeAcCapitalGovernedAi({
      agentKey: String(agent?.agent_key || body.agentKey || "ac-capital-intelligence-director"),
      workspace: String(body.workspace || "AI Command Center"),
      prompt,
      actorId: actor.id || null,
      approvalGranted: !/financial sensitive/i.test(riskLevel) || approved(approvalStatus),
      doctrineUsed,
      skill: typeof body.skill === "string" ? body.skill : null,
      riskLevel,
      forceRefresh: body.forceRefresh === true,
    });

    const confidence = Number(providerResult.output.confidence || body.confidence || 70);
    const completed = await updateRow("ac_capital_ai_agent_runs", runId, {
      confidence,
      status: "Provider Execution Completed",
      phase: "completed",
      selected_analysis_model: providerResult.model,
      analysis_provider_key: "openrouter",
      analysis_request_id: providerResult.requestId,
      input_tokens: Number(providerResult.usage.inputTokens || 0),
      output_tokens: Number(providerResult.usage.outputTokens || 0),
      result_payload: providerResult.output,
      provider_evidence: { providerType: "openrouter", model: providerResult.model, requestId: providerResult.requestId, providerRunId: providerResult.providerRunId },
      human_approval_status: providerResult.output.requiresHumanApproval ? "Human Review Required" : approvalStatus,
      completed_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      error_message: null,
      updated_at: new Date().toISOString(),
    });

    if (agent?.id) {
      await updateRow("ac_capital_ai_agents", String(agent.id), {
        status: "active",
        active_workspace: body.workspace || "AI Command Center",
        last_run_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        last_output_summary: providerResult.output.summary.slice(0, 1500),
        ai_confidence: confidence,
        consecutive_failures: 0,
        last_failure: null,
        updated_at: new Date().toISOString(),
      });
    }

    await insertRow("ac_capital_ai_audit_events", {
      actor: actor.email || actor.name,
      agent_id: agent?.id || null,
      workspace: body.workspace || "AI Command Center",
      action: "governed_openrouter_ai_run",
      object_type: "ai_run",
      object_id: runId,
      after_snapshot: { providerResult, completed },
      risk_level: riskLevel,
      approval_requirement: providerResult.output.requiresHumanApproval ? "Human review required" : "Normal controlled output",
      reason: "Manual governed execution through AC Capital AI Operations",
    });
    await insertAudit({ actor: actor.email || actor.name, action: "governed_openrouter_ai_run", objectType: "ai_run", objectId: runId, after: providerResult, risk: riskLevel, approval: providerResult.output.requiresHumanApproval ? "Human review" : "Controlled" });

    return Response.json(success({ record: completed, output: providerResult.output, provider: {
      requestId: providerResult.requestId,
      decision: providerResult.decision,
      providerType: providerResult.providerType,
      model: providerResult.model,
      usage: providerResult.usage,
    } }, "Governed OpenRouter execution completed through AC Capital AI Operations."));
  } catch (reason) {
    if (runId) {
      try {
        await updateRow("ac_capital_ai_agent_runs", runId, {
          status: "Provider Execution Failed",
          phase: "failed",
          error_message: reason instanceof Error ? reason.message.slice(0, 2000) : String(reason).slice(0, 2000),
          completed_at: new Date().toISOString(),
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch {}
    }
    return apiError(reason);
  }
}
