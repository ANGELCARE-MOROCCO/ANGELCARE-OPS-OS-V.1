
export type EmailSlaRule = {
  id: string
  name: string
  priority: "low" | "medium" | "high" | "critical"
  responseMinutes: number
  escalationRole: string
  enabled: boolean
}

export type EmailSlaEvaluation = {
  breached: boolean
  minutesOverdue: number
  escalationRole?: string
  risk: "none" | "watch" | "breach" | "critical"
}

export function evaluateSla(rule: EmailSlaRule, receivedAtIso: string, now = new Date()): EmailSlaEvaluation {
  const receivedAt = new Date(receivedAtIso)
  const elapsedMinutes = Math.floor((now.getTime() - receivedAt.getTime()) / 60000)
  const minutesOverdue = Math.max(0, elapsedMinutes - rule.responseMinutes)

  if (!rule.enabled) {
    return { breached: false, minutesOverdue: 0, risk: "none" }
  }

  if (minutesOverdue > rule.responseMinutes) {
    return { breached: true, minutesOverdue, escalationRole: rule.escalationRole, risk: "critical" }
  }

  if (minutesOverdue > 0) {
    return { breached: true, minutesOverdue, escalationRole: rule.escalationRole, risk: "breach" }
  }

  if (elapsedMinutes >= rule.responseMinutes * 0.75) {
    return { breached: false, minutesOverdue: 0, risk: "watch" }
  }

  return { breached: false, minutesOverdue: 0, risk: "none" }
}

export const defaultEmailSlaRules: EmailSlaRule[] = [
  { id: "sla-vip", name: "VIP customer response", priority: "critical", responseMinutes: 30, escalationRole: "operations_director", enabled: true },
  { id: "sla-hr", name: "HR mailbox response", priority: "high", responseMinutes: 120, escalationRole: "hr_manager", enabled: true },
  { id: "sla-support", name: "Support mailbox response", priority: "medium", responseMinutes: 240, escalationRole: "support_lead", enabled: true }
]
