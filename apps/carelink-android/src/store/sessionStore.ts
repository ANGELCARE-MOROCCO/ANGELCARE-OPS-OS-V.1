import {useSyncExternalStore} from 'react'

export type AppSession = {
  identifier: string
  agentName: string
  role: string
  accessStatus?: string
  token?: string | null
  expiresAt?: string | null
  raw?: unknown
}

let snapshot: AppSession | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function getSessionSnapshot() {
  return snapshot
}

export function setSessionSnapshot(next: AppSession | null) {
  snapshot = next
  emit()
}

export function clearSessionSnapshot() {
  setSessionSnapshot(null)
}

export function subscribeSessionStore(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSessionStore() {
  return useSyncExternalStore(subscribeSessionStore, getSessionSnapshot, getSessionSnapshot)
}
