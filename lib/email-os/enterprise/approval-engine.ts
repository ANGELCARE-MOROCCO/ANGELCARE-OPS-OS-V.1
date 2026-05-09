
export type EmailApprovalPolicy = {
  id: string
  name: string
  enabled: boolean
  mailboxIds: string[]
  requiresApprovalForExternalDomains: boolean
  requiresApprovalForAttachments: boolean
  requiresApprovalAboveRiskScore: number
  approverRoles: string[]
}

export type ApprovalDecision = {
  required: boolean
  reasons: string[]
  approverRoles: string[]
}

export function evaluateApprovalPolicy(args: {
  policy: EmailApprovalPolicy
  mailboxId?: string
  hasExternalRecipients?: boolean
  hasAttachments?: boolean
  riskScore?: number
}): ApprovalDecision {
  const reasons: string[] = []

  if (!args.policy.enabled) {
    return { required: false, reasons, approverRoles: [] }
  }

  const policyAppliesToMailbox =
    args.policy.mailboxIds.length === 0 ||
    (args.mailboxId ? args.policy.mailboxIds.includes(args.mailboxId) : false)

  if (!policyAppliesToMailbox) {
    return { required: false, reasons, approverRoles: [] }
  }

  if (args.policy.requiresApprovalForExternalDomains && args.hasExternalRecipients) {
    reasons.push("External recipients require approval")
  }

  if (args.policy.requiresApprovalForAttachments && args.hasAttachments) {
    reasons.push("Attachments require approval")
  }

  if ((args.riskScore ?? 0) >= args.policy.requiresApprovalAboveRiskScore) {
    reasons.push("Risk score threshold reached")
  }

  return {
    required: reasons.length > 0,
    reasons,
    approverRoles: reasons.length > 0 ? args.policy.approverRoles : []
  }
}

export const defaultEmailApprovalPolicies: EmailApprovalPolicy[] = [
  {
    id: "policy-external-risk",
    name: "External high-risk outbound approval",
    enabled: true,
    mailboxIds: [],
    requiresApprovalForExternalDomains: true,
    requiresApprovalForAttachments: false,
    requiresApprovalAboveRiskScore: 80,
    approverRoles: ["ceo", "operations_director"]
  },
  {
    id: "policy-attachments",
    name: "Attachment governance approval",
    enabled: true,
    mailboxIds: [],
    requiresApprovalForExternalDomains: false,
    requiresApprovalForAttachments: true,
    requiresApprovalAboveRiskScore: 60,
    approverRoles: ["operations_director", "legal"]
  }
]
