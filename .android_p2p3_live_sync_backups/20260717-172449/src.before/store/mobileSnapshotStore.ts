import {useSyncExternalStore} from 'react'

export type MobileSnapshot = {
  generatedAt: string
  missions: number
  messages: number
  notifications: number
  alerts: number
  syncState: 'online' | 'offline' | 'unknown'
  summary: string
}

let snapshot: MobileSnapshot = {
  generatedAt: new Date().toISOString(),
  missions: 0,
  messages: 0,
  notifications: 0,
  alerts: 0,
  syncState: 'unknown',
  summary: 'Snapshot mobile non initialisé.',
}
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function setMobileSnapshot(next: Partial<MobileSnapshot>) {
  snapshot = {...snapshot, ...next, generatedAt: next.generatedAt || new Date().toISOString()}
  emit()
}

export function getMobileSnapshot() {
  return snapshot
}

export function subscribeMobileSnapshot(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useMobileSnapshotStore() {
  return useSyncExternalStore(subscribeMobileSnapshot, getMobileSnapshot, getMobileSnapshot)
}
