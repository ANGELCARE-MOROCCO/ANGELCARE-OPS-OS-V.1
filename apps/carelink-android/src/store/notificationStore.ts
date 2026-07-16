import {useSyncExternalStore} from 'react'

export type NotificationSummary = {
  unreadMessages: number
  unreadNotifications: number
  criticalAlerts: number
  connectMessages: number
}

let snapshot: NotificationSummary = {
  unreadMessages: 0,
  unreadNotifications: 0,
  criticalAlerts: 0,
  connectMessages: 0,
}
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function setNotificationSummary(next: Partial<NotificationSummary>) {
  snapshot = {...snapshot, ...next}
  emit()
}

export function getNotificationSummary() {
  return snapshot
}

export function subscribeNotificationSummary(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useNotificationSummaryStore() {
  return useSyncExternalStore(subscribeNotificationSummary, getNotificationSummary, getNotificationSummary)
}
