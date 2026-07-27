const sensitiveActions = [
  "final_bank_submission",
  "vc_intro",
  "equity_dilution_communication",
  "financial_projection_release",
  "final_pitch_deck_release",
  "founder_biography_use",
  "women_cofounder_positioning",
  "sensitive_email",
  "international_expansion_claim",
  "legal_compliance_claim",
  "activate_doctrine",
  "mark_founder_approved",
  "mark_final_submission_sent",
];

export function requiresFounderApproval(action: string) {
  return sensitiveActions.includes(action);
}

export function enforceFounderApproval(input: { action: string; approvalStatus?: string | null }) {
  if (requiresFounderApproval(input.action) && input.approvalStatus !== "approved") {
    return {
      ok: false,
      code: "FOUNDER_APPROVAL_REQUIRED",
      warning: `Action ${input.action} requires approved founder authorization.`,
    };
  }

  return { ok: true, code: "APPROVAL_OK" };
}
