
export type EmailOSSlaRule = {
  id: string
  name: string
  responseMinutes: number
  priority: "low" | "medium" | "high" | "critical"
  escalationRole: string
  enabled: boolean
}

export function evaluateEmailSla(rule: EmailOSSlaRule, receivedAtIso: string, now = new Date()) {
  if (!rule.enabled) return { breached: false, risk: "none", minutesOverdue: 0 }

  const receivedAt = new Date(receivedAtIso)
  const elapsed = Math.floor((now.getTime() - receivedAt.getTime()) / 60000)
  const minutesOverdue = Math.max(0, elapsed - rule.responseMinutes)

  if (minutesOverdue > rule.responseMinutes) {
    return { breached: true, risk: "critical", minutesOverdue, escalationRole: rule.escalationRole }
  }

  if (minutesOverdue > 0) {
    return { breached: true, risk: "breach", minutesOverdue, escalationRole: rule.escalationRole }
  }

  if (elapsed >= rule.responseMinutes * 0.75) {
    return { breached: false, risk: "watch", minutesOverdue: 0 }
  }

  return { breached: false, risk: "none", minutesOverdue: 0 }
}
