'use client'

import { useCallback, useEffect, useState } from 'react'
import { emitRevenueAction, managedRevenueHeaders, revenueActionId } from '../action-center/action-events'

export type SovereignEntityType = 'objective' | 'strategy' | 'program' | 'mission' | 'task' | 'exception'

export type SovereignDepthData = {
  entityType: SovereignEntityType
  entity: Record<string, any>
  title: string
  relations: Array<Record<string, any>>
  notes: Array<Record<string, any>>
  audit: Array<Record<string, any>>
  childType: SovereignEntityType | null
  children: Array<Record<string, any>>
  generatedAt: string
}

export function useSovereignDossier({
  entityType,
  entityId,
  open,
  workspace,
  onChanged,
}: {
  entityType: SovereignEntityType
  entityId: string
  open: boolean
  workspace: string
  onChanged?: () => void | Promise<void>
}) {
  const [data, setData] = useState<SovereignDepthData | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!entityId) return
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/revenue-command-os/operational-depth?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`, { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Lecture du dossier impossible.')
      setData(body.data as SovereignDepthData)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Lecture du dossier impossible.')
    } finally {
      setBusy(false)
    }
  }, [entityId, entityType])

  useEffect(() => {
    if (open) void load()
  }, [load, open])

  const mutate = useCallback(async (action: string, payload: Record<string, unknown> = {}) => {
    const actionId = revenueActionId(`${workspace}-${action}`)
    const startedAt = new Date().toISOString()
    emitRevenueAction({
      id: actionId,
      title: `${action} · ${data?.title || entityType}`,
      workspace,
      state: 'running',
      step: 'Synchronisation du dossier',
      indeterminate: true,
      startedAt,
    })
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/revenue-command-os/operational-depth', {
        method: 'POST',
        headers: managedRevenueHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action, entityType, entityId, payload }),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Action impossible.')
      emitRevenueAction({
        id: actionId,
        title: `${action} · ${data?.title || entityType}`,
        workspace,
        state: 'success',
        step: 'Dossier synchronisé',
        progress: 100,
        startedAt,
        completedAt: new Date().toISOString(),
        resultHref: window.location.pathname,
        auditHref: '/revenue-command-os/audit',
        dismissible: true,
      })
      setMessage('Action exécutée et synchronisée.')
      await load()
      await onChanged?.()
      window.dispatchEvent(new CustomEvent('revenue-os:operation-completed', { detail: body.data }))
      return body.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action impossible.'
      emitRevenueAction({
        id: actionId,
        title: `${action} · ${data?.title || entityType}`,
        workspace,
        state: 'failure',
        step: 'Échec',
        startedAt,
        completedAt: new Date().toISOString(),
        error: errorMessage,
        dismissible: true,
      })
      setMessage(errorMessage)
      throw error
    } finally {
      setBusy(false)
    }
  }, [data?.title, entityId, entityType, load, onChanged, workspace])

  return { data, busy, message, load, mutate, setMessage }
}
