
export type EmailOSRealtimeEvent =
  | { type: "thread.updated"; threadId: string; payload?: Record<string, unknown> }
  | { type: "draft.updated"; draftId: string; payload?: Record<string, unknown> }
  | { type: "approval.changed"; approvalId: string; payload?: Record<string, unknown> }
  | { type: "queue.changed"; jobId: string; payload?: Record<string, unknown> }
  | { type: "notification.created"; notificationId: string; payload?: Record<string, unknown> }

type Listener = (event: EmailOSRealtimeEvent) => void

const listeners = new Set<Listener>()

export function subscribeEmailOSEvents(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function publishEmailOSEvent(event: EmailOSRealtimeEvent) {
  listeners.forEach((listener) => listener(event))
}
