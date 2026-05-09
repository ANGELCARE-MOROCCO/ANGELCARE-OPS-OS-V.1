
export type EmailOSNotification = {
  id: string
  type:
    | "approval_required"
    | "sla_breach"
    | "queue_failed"
    | "message_sent"
    | "sync_completed"
    | "security_event"
  title: string
  body: string
  priority: "low" | "medium" | "high" | "critical"
  createdAtIso: string
  read: boolean
}

export function createEmailNotification(
  input: Omit<EmailOSNotification, "id" | "createdAtIso" | "read">
): EmailOSNotification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAtIso: new Date().toISOString(),
    read: false,
    ...input
  }
}

export function sortNotificationsByPriority(items: EmailOSNotification[]) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 }
  return [...items].sort((a, b) => order[a.priority] - order[b.priority])
}
