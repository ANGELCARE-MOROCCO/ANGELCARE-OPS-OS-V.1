import {useSyncExternalStore} from 'react'

export type OfflineQueueItem = {
  id: string
  label: string
  endpoint: string
  payload: Record<string, unknown>
  createdAt: string
}

let snapshot: OfflineQueueItem[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function enqueueOfflineItem(item: Omit<OfflineQueueItem, 'createdAt'> & {createdAt?: string}) {
  snapshot = [...snapshot, {...item, createdAt: item.createdAt || new Date().toISOString()}]
  emit()
}

export function clearOfflineQueue() {
  snapshot = []
  emit()
}

export function getOfflineQueueSnapshot() {
  return snapshot
}

export function subscribeOfflineQueue(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useOfflineQueueStore() {
  return useSyncExternalStore(subscribeOfflineQueue, getOfflineQueueSnapshot, getOfflineQueueSnapshot)
}
