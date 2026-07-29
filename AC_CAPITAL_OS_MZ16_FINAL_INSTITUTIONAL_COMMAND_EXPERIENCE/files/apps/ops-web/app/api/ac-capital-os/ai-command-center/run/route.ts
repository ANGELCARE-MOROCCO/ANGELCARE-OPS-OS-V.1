import { executeAcCapitalGovernedAi } from "@/lib/ac-capital-os/server/ai-provider-bridge";
import { getAcCapitalFeatureFlags } from "@/lib/ac-capital-os/server/feature-flags";
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
    const liveRequested = body.liveRequested === true;
    const riskLevel = String(body.riskLevel || "Medium");
    const approvalStatus = String(body.approvalStatus || "Human Review Required");
    const prompt = String(body.prompt || "").trim() || defaultPrompt();
    const doctrineUsed = Array.isArray(body.doctrineUsed) ? body.doctrineUsed.map(String) : [];
    const flags = getAcCapitalFeatureFlags();

    if (liveRequested && !flags.allowLiveRuns) throw Object.assign(new Error("LIVE_AI_DISABLED_BY_POLICY"), { status: 403 });
    if (liveRequested && /financial sensitive/i.test(riskLevel) && !approved(approvalStatus)) {
      throw Object.assign(new Error("FOUNDER_APPROVAL_REQUIRED_FOR_FINANCIAL_SENSITIVE_AI"), { status: 403 });
    }

    const record = await insertRow("ac_capital_ai_agent_runs", {
      agent_id: agent?.id || null,
      workspace: body.workspace || "AI Command Center",
      input_source: liveRequested ? "AI Provider Control governed runtime" : "MZ15 controlled UI",
      doctrine_used: doctrineUsed,
      prompt_used: prompt,
      skill_used: body.skill || null,
      output_type: liveRequested ? "governed_provider_result" : "dry_run_result",
      confidence: Number(body.confidence || 70),
      risk_level: riskLevel,
      human_approval_status: approvalStatus,
      status: liveRequested ? "Provider Execution Running" : "Dry Run Completed",
      created_by: actor.email || actor.name,
      started_at: new Date().toISOString(),
      completed_at: liveRequested ? null : new Date().toISOString(),
    });
    runId = String(record.id);

    if (!liveRequested) {
      const output = {
        mode: "dry-run",
        agent: agent ? { id: agent.id, name: agent.agent_name, key: agent.agent_key } : null,
        summary: "The governed dry-run pathway executed without a live provider call.",
        confidence: Number(body.confidence || 70),
        riskLevel,
        doctrineUsed,
        requiresHumanApproval: true,
        providerCallMade: false,
      };
      await insertAudit({ actor: actor.email || actor.name, action: "ai_dry_run", objectType: "ai_run", objectId: runId, after: { record, output }, risk: riskLevel, approval: "Human approval" });
      return Response.json(success({ record, output }, "Dry-run completed. No live provider call occurred."));
    }

    const providerResult = await executeAcCapitalGovernedAi({
      agentKey: String(agent?.agent_key || body.agentKey || "ac_capital_intelligence_director"),
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
      human_approval_status: providerResult.output.requiresHumanApproval ? "Human Review Required" : approvalStatus,
      completed_at: new Date().toISOString(),
      error_message: null,
    });

    if (agent?.id) {
      await updateRow("ac_capital_ai_agents", String(agent.id), {
        status: "Active",
        active_workspace: body.workspace || "AI Command Center",
        last_run_at: new Date().toISOString(),
        last_output_summary: providerResult.output.summary.slice(0, 1500),
        ai_confidence: confidence,
        last_failure: null,
      });
    }

    await insertRow("ac_capital_ai_audit_events", {
      actor: actor.email || actor.name,
      agent_id: agent?.id || null,
      workspace: body.workspace || "AI Command Center",
      action: "governed_live_ai_run",
      object_type: "ai_run",
      object_id: runId,
      after_snapshot: { providerResult, completed },
      risk_level: riskLevel,
      approval_requirement: providerResult.output.requiresHumanApproval ? "Human review required" : "Normal controlled output",
      reason: "Manual governed execution through AI Provider Control",
    });
    await insertAudit({ actor: actor.email || actor.name, action: "governed_live_ai_run", objectType: "ai_run", objectId: runId, after: providerResult, risk: riskLevel, approval: providerResult.output.requiresHumanApproval ? "Human review" : "Controlled" });

    return Response.json(success({ record: completed, output: providerResult.output, provider: {
      requestId: providerResult.requestId,
      decision: providerResult.decision,
      providerType: providerResult.providerType,
      model: providerResult.model,
      reused: providerResult.reused,
      joined: providerResult.joined,
      usage: providerResult.usage,
    } }, "Governed Gemini execution completed through AI Provider Control."));
  } catch (reason) {
    if (runId) {
      try {
        await updateRow("ac_capital_ai_agent_runs", runId, {
          status: "Provider Execution Failed",
          error_message: reason instanceof Error ? reason.message.slice(0, 2000) : String(reason).slice(0, 2000),
          completed_at: new Date().toISOString(),
        });
      } catch {}
    }
    return apiError(reason);
  }
}
