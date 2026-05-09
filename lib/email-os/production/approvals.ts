
import type { EmailOSApprovalPolicy, EmailOSRole } from "./types"

export type ApprovalInput = {
  policy: EmailOSApprovalPolicy
  mailboxId?: string
  hasExternalRecipients?: boolean
  hasAttachments?: boolean
  riskScore?: number
}

export function evaluateApproval(input: ApprovalInput) {
  const reasons: string[] = []
  const applies =
    input.policy.enabled &&
    (input.policy.mailboxIds.length === 0 ||
      (input.mailboxId ? input.policy.mailboxIds.includes(input.mailboxId) : false))

  if (!applies) {
    return { required: false, reasons, approverRoles: [] as EmailOSRole[] }
  }

  if (input.policy.requiresExternalApproval && input.hasExternalRecipients) {
    reasons.push("External recipient approval required")
  }

  if (input.policy.requiresAttachmentApproval && input.hasAttachments) {
    reasons.push("Attachment approval required")
  }

  if ((input.riskScore ?? 0) >= input.policy.riskThreshold) {
    reasons.push("Risk threshold reached")
  }

  return {
    required: reasons.length > 0,
    reasons,
    approverRoles: reasons.length > 0 ? input.policy.approverRoles : []
  }
}
