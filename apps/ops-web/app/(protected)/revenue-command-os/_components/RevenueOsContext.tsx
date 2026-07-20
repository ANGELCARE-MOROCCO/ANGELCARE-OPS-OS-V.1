'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { RevenueOsFoundationBootstrap, RevenueOsObjectiveInput } from '@/lib/revenue-command-os/types'

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
      const response = await fetch('/api/revenue-command-os/foundation', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message || 'Actualisation impossible.')
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
      const response = await fetch('/api/revenue-command-os/foundation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_objective', payload: input }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message || 'Création impossible.')
      setBootstrap((current) => ({
        ...current,
        objectives: [payload.data, ...current.objectives],
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
