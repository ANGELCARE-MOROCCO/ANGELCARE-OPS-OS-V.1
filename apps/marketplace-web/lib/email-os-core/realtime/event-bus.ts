type EventPayload = Record<string, unknown>

type Subscriber = (payload: EventPayload) => void

const listeners = new Map<string, Set<Subscriber>>()

export function publishEmailOSEvent(channel: string, payload: EventPayload) {
  const subs = listeners.get(channel)
  if (!subs) return

  for (const subscriber of subs) {
    try {
      subscriber(payload)
    } catch (error) {
      console.error("Email-OS realtime subscriber failed", error)
    }
  }
}

export function subscribeEmailOSEvent(channel: string, subscriber: Subscriber) {
  if (!listeners.has(channel)) {
    listeners.set(channel, new Set())
  }

  listeners.get(channel)?.add(subscriber)

  return () => {
    listeners.get(channel)?.delete(subscriber)
  }
}
