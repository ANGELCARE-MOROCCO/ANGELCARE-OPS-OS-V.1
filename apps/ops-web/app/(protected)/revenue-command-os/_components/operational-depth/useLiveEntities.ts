'use client'

import { useCallback, useEffect, useState } from 'react'

type EntityType = 'objective' | 'strategy' | 'program' | 'mission' | 'task' | 'exception'

export function useLiveEntities(entityType: EntityType) {
  const [rows, setRows] = useState<Array<Record<string, any>>>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setBusy(true); setError('')
    try {
      const response = await fetch(`/api/revenue-command-os/live-operations?entityType=${entityType}&limit=500`, { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Chargement impossible.')
      setRows(Array.isArray(body.data?.rows) ? body.data.rows : [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chargement impossible.')
    } finally { setBusy(false) }
  }, [entityType])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const handler = () => void refresh()
    window.addEventListener('revenue-os:operation-completed', handler)
    return () => window.removeEventListener('revenue-os:operation-completed', handler)
  }, [refresh])

  return { rows, busy, error, refresh }
}
