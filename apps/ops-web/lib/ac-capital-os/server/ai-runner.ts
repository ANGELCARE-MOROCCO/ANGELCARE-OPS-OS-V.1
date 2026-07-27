import { enforceFounderApproval } from "./approval-guard";
import { requestProviderControlAction } from "./ai-provider-bridge";
import { getAcCapitalFeatureFlags } from "./feature-flags";
import { supabaseRestInsert } from "./supabase";

export async function runAcCapitalAiAgent(input: {
  agentKey: string;
  workspace: string;
  prompt?: string;
  approvalStatus?: string;
  riskLevel?: string;
  liveRequested?: boolean;
}) {
  const flags = getAcCapitalFeatureFlags();

  if (flags.executionMode === "disabled") {
    return { ok: false, dataMode: "disabled", source: "none", code: "AI_DISABLED", warning: "AC Capital AI execution is disabled." };
  }

  const approval = enforceFounderApproval({
    action: input.riskLevel === "Financial Sensitive" ? "financial_projection_release" : "ai_run",
    approvalStatus: input.approvalStatus,
  });

  if (!approval.ok) {
    return { ok: false, dataMode: "disabled", source: "none", code: approval.code, warning: approval.warning };
  }

  const runRecord = {
    workspace: input.workspace,
    input_source: "api",
    output_type: "dry_run_result",
    confidence: 70,
    risk_level: input.riskLevel || "Medium",
    human_approval_status: input.approvalStatus || "not required",
    status: flags.allowLiveRuns && input.liveRequested ? "Queued for provider-control" : "Dry Run Completed",
    created_by: "system-safe",
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };

  await supabaseRestInsert("ac_capital_ai_agent_runs", runRecord);

  if (flags.allowLiveRuns && input.liveRequested) {
    const providerResult = await requestProviderControlAction({
      module: "ac_capital_os",
      agentKey: input.agentKey,
      workspace: input.workspace,
      prompt: input.prompt,
    });

    return {
      ok: providerResult.ok,
      dataMode: "supabase-live",
      source: "supabase",
      warning: providerResult.warning,
      data: { mode: providerResult.mode, runRecord, providerResult },
    };
  }

  return {
    ok: true,
    dataMode: "supabase-live",
    source: "supabase",
    warning: "AI dry-run completed. No live model call was made.",
    data: {
      mode: "dry-run",
      agentKey: input.agentKey,
      workspace: input.workspace,
      output: "Dry-run AI execution is wired and governed. Enable live flags only after provider-control QA.",
      runRecord,
    },
  };
}
