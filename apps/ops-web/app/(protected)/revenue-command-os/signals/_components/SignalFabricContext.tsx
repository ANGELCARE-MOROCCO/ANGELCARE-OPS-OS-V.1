'use client'

import { fetchRevenueOsJson, type RevenueOsClientEnvelope } from '@/lib/revenue-command-os/client-http'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type {
  RevenueSignal,
  RevenueSignalBootstrap,
  RevenueSignalContextSnapshot,
  RevenueSignalSource,
  RevenueSignalValidationIssue,
} from '@/lib/revenue-command-os/types'

type Value = {
  fabric: RevenueSignalBootstrap
  warnings: string[]
  busy: boolean
  error: string | null
  selected: RevenueSignal | null
  setSelected: (value: RevenueSignal | null) => void
  refresh: () => Promise<void>
  runValidation: () => Promise<void>
  runAllScans: () => Promise<void>
  runSourceScan: (sourceCode: string) => Promise<void>
  updateSignalStatus: (id: string, status: RevenueSignal['status']) => Promise<void>
  buildContext: (signalId: string, visibilityProfile?: RevenueSignalContextSnapshot['visibilityProfile']) => Promise<void>
  updateSourceStatus: (id: string, status: RevenueSignalSource['status']) => Promise<void>
  updateIssueStatus: (id: string, status: RevenueSignalValidationIssue['status']) => Promise<void>
}

const Context = createContext<Value | null>(null)

type ApiEnvelope = RevenueOsClientEnvelope<RevenueSignalBootstrap>


export function SignalFabricProvider({
  initialFabric,
  initialWarnings = [],
  children,
}: {
  initialFabric: RevenueSignalBootstrap
  initialWarnings?: string[]
  children: ReactNode
}) {
  const [fabric, setFabric] = useState(initialFabric)
  const [warnings, setWarnings] = useState(initialWarnings)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<RevenueSignal | null>(null)

  const request = useCallback(async (body?: Record<string, unknown>): Promise<ApiEnvelope> => {
    return fetchRevenueOsJson<RevenueSignalBootstrap>(
      '/api/revenue-command-os/signals',
      body
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        : { cache: 'no-store' },
      {
        timeoutMs: 20000,
        fallbackMessage: 'Le tissu de signaux est momentanément indisponible.',
      },
    )
  }, [])

  const applySnapshot = useCallback((payload: ApiEnvelope) => {
    if (payload.data) setFabric(payload.data)
    const nextWarnings = payload.meta?.warnings
    setWarnings(Array.isArray(nextWarnings) ? nextWarnings.map(String) : [])
  }, [])

  const refresh = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      applySnapshot(await request())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Actualisation impossible.')
    } finally {
      setBusy(false)
    }
  }, [applySnapshot, request])

  const mutate = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      setBusy(true)
      setError(null)
      try {
        await request({ action, payload })
        const next = await request()
        applySnapshot(next)
        if (selected && next.data) {
          const updated = next.data.signals.find((signal) => signal.id === selected.id)
          if (updated) setSelected(updated)
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Action impossible.')
        throw caught
      } finally {
        setBusy(false)
      }
    },
    [applySnapshot, request, selected],
  )

  const value = useMemo<Value>(
    () => ({
      fabric,
      warnings,
      busy,
      error,
      selected,
      setSelected,
      refresh,
      runValidation: () => mutate('run_validation'),
      runAllScans: () => mutate('run_all_scans'),
      runSourceScan: (sourceCode) => mutate('run_source_scan', { sourceCode }),
      updateSignalStatus: (id, status) => mutate('update_signal_status', { id, status }),
      buildContext: (signalId, visibilityProfile = 'revenue-manager') =>
        mutate('build_context', { signalId, visibilityProfile, audienceRole: 'Direction Revenue' }),
      updateSourceStatus: (id, status) => mutate('update_source_status', { id, status }),
      updateIssueStatus: (id, status) => mutate('update_validation_status', { id, status }),
    }),
    [fabric, warnings, busy, error, selected, refresh, mutate],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useSignalFabric() {
  const value = useContext(Context)
  if (!value) throw new Error('SignalFabricProvider manquant.')
  return value
}
