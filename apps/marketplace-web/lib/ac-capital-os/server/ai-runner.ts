import { enforceFounderApproval } from "./approval-guard";
import { requestProviderControlAction } from "./ai-provider-bridge";
import { supabaseRestInsert } from "./supabase";

export async function runAcCapitalAiAgent(input: {
  agentKey: string;
  workspace: string;
  prompt?: string;
  approvalStatus?: string;
  riskLevel?: string;
  liveRequested?: boolean;
}) {
  const approval = enforceFounderApproval({
    action: input.riskLevel === "Financial Sensitive" ? "financial_projection_release" : "ai_run",
    approvalStatus: input.approvalStatus,
  });
  if (!approval.ok) return { ok: false, dataMode: "disabled", source: "none", code: approval.code, warning: approval.warning };
  if (!input.liveRequested) {
    return { ok: false, dataMode: "not-executed", source: "none", code: "AC_CAPITAL_REAL_PROVIDER_EXECUTION_REQUIRED", warning: "No AI call was made. Request a governed provider execution instead of a dry-run." };
  }

  const startedAt = new Date().toISOString();
  const providerResult = await requestProviderControlAction({
    agentKey: input.agentKey,
    workspace: input.workspace,
    prompt: input.prompt,
    approvalGranted: true,
    riskLevel: input.riskLevel,
  });
  const runRecord = {
    workspace: input.workspace,
    input_source: "AC Capital governed OpenRouter runtime",
    output_type: "governed_openrouter_result",
    confidence: providerResult.output.confidence,
    risk_level: input.riskLevel || "Medium",
    human_approval_status: input.approvalStatus || "Human Review Required",
    status: "Provider Execution Completed",
    created_by: "system-safe",
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    result_payload: providerResult.output,
  };
  await supabaseRestInsert("ac_capital_ai_agent_runs", runRecord);
  return { ok: true, dataMode: "provider-live", source: "openrouter", data: { mode: providerResult.mode, runRecord, providerResult } };
}
