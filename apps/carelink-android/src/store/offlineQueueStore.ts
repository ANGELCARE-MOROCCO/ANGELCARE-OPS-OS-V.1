import {useSyncExternalStore} from 'react'

export type OfflineQueueItem = {id: string; label: string; endpoint: string; payload: Record<string, unknown>; createdAt: string; status?: 'pending' | 'failed' | 'sent'; lastError?: string}
let snapshot: OfflineQueueItem[] = []
const listeners = new Set<() => void>()
function emit() { listeners.forEach((listener) => listener()) }
export function enqueueOfflineItem(item: Omit<OfflineQueueItem, 'createdAt' | 'status'> & {createdAt?: string; status?: OfflineQueueItem['status']}) {
  const next = {...item, createdAt: item.createdAt || new Date().toISOString(), status: item.status || 'pending'}
  snapshot = snapshot.some((current) => current.id === item.id) ? snapshot.map((current) => current.id === item.id ? next : current) : [...snapshot, next]
  emit()
}
export function removeOfflineItem(id: string) { snapshot = snapshot.filter((item) => item.id !== id); emit() }
export function markOfflineItemFailed(id: string, lastError: string) { snapshot = snapshot.map((item) => item.id === id ? {...item, status: 'failed', lastError} : item); emit() }
export function clearOfflineQueue() { snapshot = []; emit() }
export function getOfflineQueueSnapshot() { return snapshot }
export function subscribeOfflineQueue(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener) }
export function useOfflineQueueStore() { return useSyncExternalStore(subscribeOfflineQueue, getOfflineQueueSnapshot, getOfflineQueueSnapshot) }
