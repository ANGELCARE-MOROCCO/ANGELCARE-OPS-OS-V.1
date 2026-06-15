'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type CareLinkOfflineQueueStatus = 'pending' | 'syncing' | 'synced' | 'failed'

export type CareLinkOfflineQueueItem = {
  id: string
  endpoint: string
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  payload: Record<string, unknown>
  missionId: number | null
  label: string
  status: CareLinkOfflineQueueStatus
  attempts: number
  createdAt: string
  updatedAt: string
  idempotencyKey: string
  error?: string | null
}

export type CareLinkQueueDispatchResult =
  | { ok: true; queued: false; data: unknown }
  | { ok: true; queued: true; item: CareLinkOfflineQueueItem }
  | { ok: false; queued: false; error: string }

const STORAGE_KEY = 'angelcare_carelink_offline_queue_v1'
const memoryQueue: CareLinkOfflineQueueItem[] = []

function now() {
  return new Date().toISOString()
}

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `queue-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function canUseStorage() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

function loadQueue(): CareLinkOfflineQueueItem[] {
  if (!canUseStorage()) return [...memoryQueue]
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data as CareLinkOfflineQueueItem[] : []
  } catch {
    return []
  }
}

function saveQueue(queue: CareLinkOfflineQueueItem[]) {
  if (!canUseStorage()) {
    memoryQueue.splice(0, memoryQueue.length, ...queue)
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    memoryQueue.splice(0, memoryQueue.length, ...queue)
  }
}

function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

async function performRequest(item: CareLinkOfflineQueueItem) {
  const response = await fetch(item.endpoint, {
    method: item.method,
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': item.idempotencyKey,
    },
    body: JSON.stringify({ ...item.payload, idempotencyKey: item.idempotencyKey }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `HTTP ${response.status}`)
  }
  return data
}

export function useCareLinkOfflineQueue() {
  const [queue, setQueue] = useState<CareLinkOfflineQueueItem[]>(() => loadQueue())
  const [syncing, setSyncing] = useState(false)
  const mountedRef = useRef(false)
  const queueRef = useRef(queue)

  useEffect(() => {
    queueRef.current = queue
    saveQueue(queue)
  }, [queue])

  const syncQueue = useCallback(async () => {
    if (!isOnline() || syncing) return queueRef.current
    setSyncing(true)
    const nextQueue = [...queueRef.current]
    let mutated = false

    for (let index = 0; index < nextQueue.length; index += 1) {
      const item = nextQueue[index]
      if (item.status === 'synced') continue
      nextQueue[index] = { ...item, status: 'syncing', attempts: item.attempts + 1, updatedAt: now(), error: null }
      mutated = true
      if (mountedRef.current) setQueue([...nextQueue])
      try {
        await performRequest(nextQueue[index])
        nextQueue[index] = { ...nextQueue[index], status: 'synced', updatedAt: now(), error: null }
        mutated = true
        if (mountedRef.current) setQueue([...nextQueue])
      } catch (error) {
        nextQueue[index] = { ...item, status: 'failed', attempts: item.attempts + 1, updatedAt: now(), error: error instanceof Error ? error.message : 'Synchronisation impossible' }
        mutated = true
        if (mountedRef.current) setQueue([...nextQueue])
      }
    }

    if (mutated) saveQueue(nextQueue)
    setSyncing(false)
    return nextQueue
  }, [syncing])

  useEffect(() => {
    mountedRef.current = true
    const handleNetworkChange = () => {
      if (isOnline()) void syncQueue()
    }
    window.addEventListener('online', handleNetworkChange)
    window.addEventListener('offline', handleNetworkChange)
    return () => {
      mountedRef.current = false
      window.removeEventListener('online', handleNetworkChange)
      window.removeEventListener('offline', handleNetworkChange)
    }
  }, [syncQueue])

  useEffect(() => {
    if (!isOnline()) return
    const handleOnline = () => {
      void syncQueue()
    }
    window.addEventListener('online', handleOnline)
    const interval = window.setInterval(() => {
      if (queueRef.current.some((item) => item.status === 'pending' || item.status === 'failed')) {
        void syncQueue()
      }
    }, 15_000)
    void syncQueue()
    return () => {
      window.removeEventListener('online', handleOnline)
      window.clearInterval(interval)
    }
  }, [syncQueue])

  const dispatch = useCallback(async (input: {
    endpoint: string
    method?: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    payload?: Record<string, unknown>
    missionId?: number | null
    label?: string
    idempotencyKey?: string
  }): Promise<CareLinkQueueDispatchResult> => {
    const item: CareLinkOfflineQueueItem = {
      id: uid(),
      endpoint: input.endpoint,
      method: input.method || 'POST',
      payload: input.payload || {},
      missionId: input.missionId ?? null,
      label: input.label || input.endpoint,
      status: 'pending',
      attempts: 0,
      createdAt: now(),
      updatedAt: now(),
      idempotencyKey: input.idempotencyKey || uid(),
      error: null,
    }

    if (isOnline()) {
      try {
        const data = await performRequest(item)
        return { ok: true, queued: false, data }
      } catch (error) {
        const nextQueue = [...queueRef.current, item]
        if (mountedRef.current) setQueue(nextQueue)
        saveQueue(nextQueue)
        return { ok: true, queued: true, item }
      }
    }

    const nextQueue = [...queueRef.current, item]
    if (mountedRef.current) setQueue(nextQueue)
    saveQueue(nextQueue)
    return { ok: true, queued: true, item }
  }, [])

  const pendingCount = useMemo(() => queue.filter((item) => item.status === 'pending' || item.status === 'failed').length, [queue])
  const syncedCount = useMemo(() => queue.filter((item) => item.status === 'synced').length, [queue])
  const failedCount = useMemo(() => queue.filter((item) => item.status === 'failed').length, [queue])

  return {
    queue,
    pendingCount,
    syncedCount,
    failedCount,
    syncing,
    isOnline: isOnline(),
    dispatch,
    syncQueue,
  }
}
