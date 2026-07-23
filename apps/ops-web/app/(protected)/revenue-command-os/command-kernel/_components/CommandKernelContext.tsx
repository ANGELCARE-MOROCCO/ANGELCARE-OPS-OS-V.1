'use client'

import { fetchRevenueOsJson } from '@/lib/revenue-command-os/client-http'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { RevenueCommandKernelBootstrap } from '@/lib/revenue-command-os/command-kernel/types'

type State = {
  data: RevenueCommandKernelBootstrap | null
  warnings: string[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  simulate: (payload?: Record<string, unknown>) => Promise<any>
}


const Context = createContext<State | null>(null)


export function CommandKernelProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RevenueCommandKernelBootstrap | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const body = await fetchRevenueOsJson<RevenueCommandKernelBootstrap>('/api/revenue-command-os/command-kernel', { cache: 'no-store' }, { fallbackMessage: 'Chargement impossible.' })
      if (!body.data) throw new Error('Le noyau de commandes n’a retourné aucune donnée.')
      setData(body.data)
      setWarnings(Array.isArray(body.meta?.warnings) ? body.meta.warnings : [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const simulate = useCallback(async (payload: Record<string, unknown> = {}) => {
    const body = await fetchRevenueOsJson<unknown>('/api/revenue-command-os/command-kernel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'simulate', payload }),
    }, { fallbackMessage: 'Simulation impossible.' })
    return body.data
  }, [])

  const value = useMemo(() => ({ data, warnings, loading, error, refresh, simulate }), [data, warnings, loading, error, refresh, simulate])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useCommandKernel() {
  const value = useContext(Context)
  if (!value) throw new Error('CommandKernelProvider requis')
  return value
}
