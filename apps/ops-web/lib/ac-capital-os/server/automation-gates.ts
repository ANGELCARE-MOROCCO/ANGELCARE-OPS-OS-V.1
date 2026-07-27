import { enforceFounderApproval } from "./approval-guard";
import { supabaseRestInsert } from "./supabase";

export async function prepareEmailDraft(input: { subject: string; recipient?: string; body?: string; approvalStatus?: string }) {
  const approval = enforceFounderApproval({ action: "sensitive_email", approvalStatus: input.approvalStatus });

  const record = {
    subject: input.subject,
    recipient: input.recipient || "recipient pending",
    body_draft: input.body || "",
    approval_required: true,
    approval_status: input.approvalStatus || "pending",
    send_instruction: approval.ok ? "Ready for manual sending after final human check." : "Do not send. Founder approval required.",
    status: "Prepared",
    created_at: new Date().toISOString(),
  };

  await supabaseRestInsert("ac_capital_coordinator_manual_emails", record);

  return {
    ok: true,
    dataMode: "supabase-live",
    source: "supabase",
    warning: approval.ok ? undefined : approval.warning,
    data: record,
  };
}

export async function markEmailSentManually(input: { emailId?: string; proofReference?: string; approvalStatus?: string }) {
  const record = {
    action: "mark_sent_manually",
    object_type: "manual_email",
    object_id: input.emailId || null,
    after_state: { proofReference: input.proofReference || null, approvalStatus: input.approvalStatus || "unknown" },
    risk_level: "Medium",
    approval_requirement: input.approvalStatus || "manual proof required",
    reason: "Coordinator marked email as sent manually. No automatic email was sent.",
    created_at: new Date().toISOString(),
  };

  await supabaseRestInsert("ac_capital_automation_gate_events", {
    gate_type: "email_mark_sent_manual",
    status: "Logged",
    metadata: record,
    created_at: new Date().toISOString(),
  });

  return { ok: true, dataMode: "supabase-live", source: "supabase", data: record };
}

export async function completeCoordinatorTask(input: { taskId?: string; completionNote?: string }) {
  const record = {
    event_type: "task_completed",
    related_task_id: input.taskId || null,
    completed_by: "system-safe",
    completed_at: new Date().toISOString(),
    proof_reference: input.completionNote || null,
    next_action_created: false,
    pipeline_update_required: true,
  };

  await supabaseRestInsert("ac_capital_coordinator_completion_events", record);
  return { ok: true, dataMode: "supabase-live", source: "supabase", data: record };
}
