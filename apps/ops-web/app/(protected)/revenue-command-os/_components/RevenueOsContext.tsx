'use client'

import { fetchRevenueOsJson } from '@/lib/revenue-command-os/client-http'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { RevenueOsFoundationBootstrap, RevenueOsObjective, RevenueOsObjectiveInput } from '@/lib/revenue-command-os/types'

type RevenueOsContextValue = {
  bootstrap: RevenueOsFoundationBootstrap
  busy: boolean
  error: string | null
  refresh: () => Promise<void>
  createObjective: (input: RevenueOsObjectiveInput) => Promise<void>
}

const RevenueOsContext = createContext<RevenueOsContextValue | null>(null)

export function RevenueOsProvider({
  initialBootstrap,
  children,
}: {
  initialBootstrap: RevenueOsFoundationBootstrap
  children: React.ReactNode
}) {
  const [bootstrap, setBootstrap] = useState(initialBootstrap)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const payload = await fetchRevenueOsJson<typeof initialBootstrap>('/api/revenue-command-os/foundation', { cache: 'no-store' }, { fallbackMessage: 'Actualisation impossible.' })
      if (!payload.data) throw new Error('Le socle Revenue OS n’a retourné aucune donnée exploitable.')
      setBootstrap(payload.data)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Actualisation impossible.')
    } finally {
      setBusy(false)
    }
  }, [])

  const createObjective = useCallback(async (input: RevenueOsObjectiveInput) => {
    setBusy(true)
    setError(null)
    try {
      const payload = await fetchRevenueOsJson<RevenueOsObjective>('/api/revenue-command-os/foundation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_objective', payload: input }),
      }, { fallbackMessage: 'Création impossible.' })
      if (!payload.data) throw new Error('L’objectif créé n’a pas été retourné par le service.')
      const createdObjective = payload.data
      setBootstrap((current) => ({
        ...current,
        objectives: [createdObjective, ...current.objectives],
      }))
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Création impossible.'
      setError(message)
      throw createError
    } finally {
      setBusy(false)
    }
  }, [])

  const value = useMemo(() => ({ bootstrap, busy, error, refresh, createObjective }), [bootstrap, busy, error, refresh, createObjective])
  return <RevenueOsContext.Provider value={value}>{children}</RevenueOsContext.Provider>
}

export function useRevenueOs() {
  const context = useContext(RevenueOsContext)
  if (!context) throw new Error('useRevenueOs doit être utilisé dans RevenueOsProvider.')
  return context
}
