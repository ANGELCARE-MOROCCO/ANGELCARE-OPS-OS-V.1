'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { CareLinkMobileWorkspace } from './mobile-adapter'

export type CareLinkRealtimeState = {
  workspace: CareLinkMobileWorkspace | null
  connected: boolean
  source: 'initial' | 'realtime' | 'polling'
  lastSyncedAt: string | null
  error: string | null
  refresh: () => Promise<CareLinkMobileWorkspace | null>
}

const REALTIME_TABLES = ['missions', 'mission_events', 'caregiver_checkins', 'incidents', 'messages', 'notifications', 'alerts', 'carelink_dispatch_messages', 'carelink_mission_checklist_items', 'carelink_mission_reports', 'carelink_payment_disputes', 'carelink_agent_documents', 'mission_allowances'] as const

async function loadWorkspace() {
  const response = await fetch('/api/carelink/dashboard', { cache: 'no-store', headers: { Accept: 'application/json' } })
  const json = await response.json().catch(() => ({}))
  const payload = json?.data && json.data.records ? json.data : json
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || 'Impossible de synchroniser CareLink mobile')
  }
  return (payload?.records ? payload : payload?.data?.records ? payload.data : payload) as CareLinkMobileWorkspace
}

export function useCareLinkRealtime(initialWorkspace: CareLinkMobileWorkspace | null = null, options?: { enabled?: boolean; pollIntervalMs?: number }): CareLinkRealtimeState {
  const enabled = options?.enabled ?? true
  const pollIntervalMs = options?.pollIntervalMs ?? 30_000
  const [workspace, setWorkspace] = useState<CareLinkMobileWorkspace | null>(initialWorkspace)
  const [connected, setConnected] = useState(false)
  const [source, setSource] = useState<'initial' | 'realtime' | 'polling'>('initial')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(initialWorkspace?.generatedAt || null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const next = await loadWorkspace()
    setWorkspace(next)
    setLastSyncedAt(new Date().toISOString())
    setError(null)
    return next
  }, [])

  const tables = useMemo(() => [...REALTIME_TABLES], [])

  useEffect(() => {
    if (!enabled) return

    let mounted = true
    let intervalId: ReturnType<typeof setInterval> | null = null
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null
    let client: ReturnType<typeof createBrowserSupabaseClient> | null = null
    let channel: ReturnType<ReturnType<typeof createBrowserSupabaseClient>['channel']> | null = null
    let refreshInFlight = false

    const scheduleRefresh = (nextSource: 'realtime' | 'polling') => {
      if (refreshTimeout) clearTimeout(refreshTimeout)
      refreshTimeout = setTimeout(() => {
        if (!mounted || refreshInFlight) return
        refreshInFlight = true
        refresh().then(() => {
          if (mounted) setSource(nextSource)
        }).catch((err) => {
          if (!mounted) return
          setError(err instanceof Error ? err.message : 'Synchronisation CareLink indisponible')
        }).finally(() => {
          refreshInFlight = false
        })
      }, 250)
    }

    const fallbackPoll = () => {
      if (intervalId) clearInterval(intervalId)
      intervalId = setInterval(() => {
        scheduleRefresh('polling')
      }, pollIntervalMs)
      setSource((current) => (current === 'initial' ? 'polling' : current))
    }

    const connect = async () => {
      try {
        client = createBrowserSupabaseClient()
        channel = client.channel('carelink-mobile-realtime')

        tables.forEach((table) => {
          channel?.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
            scheduleRefresh('realtime')
          })
        })

        channel
          .subscribe((status) => {
            if (!mounted) return
            if (status === 'SUBSCRIBED') {
              setConnected(true)
              scheduleRefresh('realtime')
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              setConnected(false)
              setSource('polling')
              fallbackPoll()
            }
          })
      } catch {
        if (!mounted) return
        setConnected(false)
        setSource('polling')
        fallbackPoll()
      }
    }

    connect()

    return () => {
      mounted = false
      if (refreshTimeout) clearTimeout(refreshTimeout)
      if (intervalId) clearInterval(intervalId)
      if (client && channel) {
        try {
          client.removeChannel(channel)
        } catch {}
      }
    }
  }, [enabled, pollIntervalMs, refresh, tables])

  return { workspace, connected, source, lastSyncedAt, error, refresh }
}
