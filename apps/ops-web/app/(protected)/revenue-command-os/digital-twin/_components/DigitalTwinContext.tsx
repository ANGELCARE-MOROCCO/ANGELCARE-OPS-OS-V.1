'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { RevenueTwinBootstrap, RevenueTwinMutationInput, RevenueTwinValidationIssue } from '@/lib/revenue-command-os/types'

type ContextValue = {
  twin: RevenueTwinBootstrap
  busy: boolean
  error: string | null
  refresh: () => Promise<void>
  runValidation: () => Promise<void>
  mutate: (input: RevenueTwinMutationInput) => Promise<void>
  updateIssueStatus: (issueId: string, status: RevenueTwinValidationIssue['status']) => Promise<void>
}

const DigitalTwinContext = createContext<ContextValue | null>(null)

export function DigitalTwinProvider({ initialTwin, children }: { initialTwin: RevenueTwinBootstrap; children: React.ReactNode }) {
  const [twin, setTwin] = useState(initialTwin)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async (body?: Record<string, unknown>) => {
    const response = await fetch('/api/revenue-command-os/digital-twin', body ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    } : { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.error?.message || 'Opération Digital Twin impossible.')
    return payload
  }, [])

  const refresh = useCallback(async () => {
    setBusy(true); setError(null)
    try { const payload = await request(); setTwin(payload.data) }
    catch (current) { setError(current instanceof Error ? current.message : 'Actualisation impossible.') }
    finally { setBusy(false) }
  }, [request])

  const runValidation = useCallback(async () => {
    setBusy(true); setError(null)
    try { await request({ action: 'run_validation' }); const payload = await request(); setTwin(payload.data) }
    catch (current) { setError(current instanceof Error ? current.message : 'Validation impossible.') }
    finally { setBusy(false) }
  }, [request])

  const mutate = useCallback(async (input: RevenueTwinMutationInput) => {
    setBusy(true); setError(null)
    try { await request({ action: 'mutate_entity', payload: { entity: input.entity, operation: input.operation, id: input.id, data: input.payload } }); const payload = await request(); setTwin(payload.data) }
    catch (current) { setError(current instanceof Error ? current.message : 'Mutation impossible.'); throw current }
    finally { setBusy(false) }
  }, [request])

  const updateIssueStatus = useCallback(async (issueId: string, status: RevenueTwinValidationIssue['status']) => {
    setBusy(true); setError(null)
    try { await request({ action: 'update_validation_status', payload: { issueId, status } }); const payload = await request(); setTwin(payload.data) }
    catch (current) { setError(current instanceof Error ? current.message : 'Mise à jour impossible.') }
    finally { setBusy(false) }
  }, [request])

  const value = useMemo(() => ({ twin, busy, error, refresh, runValidation, mutate, updateIssueStatus }), [twin, busy, error, refresh, runValidation, mutate, updateIssueStatus])
  return <DigitalTwinContext.Provider value={value}>{children}</DigitalTwinContext.Provider>
}

export function useDigitalTwin() {
  const value = useContext(DigitalTwinContext)
  if (!value) throw new Error('DigitalTwinProvider manquant.')
  return value
}
