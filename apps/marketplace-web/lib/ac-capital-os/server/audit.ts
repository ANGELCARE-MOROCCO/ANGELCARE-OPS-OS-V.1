import { supabaseRestInsert } from "./supabase";
import type { AcCapitalActor, AcCapitalRiskLevel } from "./types";

export async function writeAcCapitalAuditEvent(input: {
  actor?: AcCapitalActor;
  action: string;
  workspace: string;
  objectType?: string;
  objectId?: string;
  beforeState?: unknown;
  afterState?: unknown;
  riskLevel?: AcCapitalRiskLevel | string;
  approvalRequirement?: string;
  reason?: string;
}) {
  const record = {
    actor: input.actor?.email || input.actor?.name || input.actor?.id || "system-safe",
    action: input.action,
    object_type: input.objectType || "ac_capital_event",
    object_id: input.objectId || null,
    before_state: input.beforeState || null,
    after_state: input.afterState || null,
    risk_level: input.riskLevel || "Low",
    approval_requirement: input.approvalRequirement || "Human review where sensitive",
    reason: input.reason || `AC CAPITAL OS audit: ${input.workspace}`,
  };

  return supabaseRestInsert("ac_capital_strategy_audit_events", record);
}
