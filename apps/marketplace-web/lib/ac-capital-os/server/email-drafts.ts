export function buildSafeEmailDraft(input: { subject: string; body: string; recipient?: string }) {
  return {
    subject: input.subject,
    recipient: input.recipient || "recipient pending",
    body: input.body,
    sendMode: "manual-only",
    safety: [
      "No automatic sending",
      "Founder approval required when sensitive",
      "Proof must be logged after manual sending",
    ],
  };
}
