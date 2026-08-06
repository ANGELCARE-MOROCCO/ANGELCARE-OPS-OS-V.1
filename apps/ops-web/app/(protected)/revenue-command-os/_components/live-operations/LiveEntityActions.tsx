'use client'

import { useState } from 'react'
import { Archive, CheckCircle2, CirclePlay, Loader2, Pause, RefreshCw, RotateCcw, XCircle } from 'lucide-react'
import { emitRevenueAction, managedRevenueHeaders, revenueActionId } from '../action-center/action-events'

type EntityType = 'objective' | 'strategy' | 'program' | 'mission' | 'task' | 'exception'
type Action = 'activate' | 'start' | 'pause' | 'resume' | 'complete' | 'close' | 'reopen' | 'cancel' | 'archive' | 'delete' | 'retry' | 'execute'

type Definition = { action: Action; label: string; icon: typeof CirclePlay; tone: string }

const definitions: Record<EntityType, Definition[]> = {
  objective: [
    { action: 'execute', label: 'Lancer', icon: CirclePlay, tone: 'bg-blue-700' },
    { action: 'pause', label: 'Pause', icon: Pause, tone: 'bg-amber-600' },
    { action: 'complete', label: 'Terminer', icon: CheckCircle2, tone: 'bg-emerald-700' },
    { action: 'reopen', label: 'Rouvrir', icon: RotateCcw, tone: 'bg-violet-700' },
  ],
  program: [
    { action: 'activate', label: 'Activer', icon: CirclePlay, tone: 'bg-blue-700' },
    { action: 'pause', label: 'Pause', icon: Pause, tone: 'bg-amber-600' },
    { action: 'resume', label: 'Reprendre', icon: RefreshCw, tone: 'bg-emerald-700' },
    { action: 'close', label: 'Clôturer', icon: CheckCircle2, tone: 'bg-slate-900' },
    { action: 'reopen', label: 'Rouvrir', icon: RotateCcw, tone: 'bg-violet-700' },
  ],
  mission: [
    { action: 'start', label: 'Démarrer', icon: CirclePlay, tone: 'bg-blue-700' },
    { action: 'pause', label: 'Pause', icon: Pause, tone: 'bg-amber-600' },
    { action: 'resume', label: 'Reprendre', icon: RefreshCw, tone: 'bg-emerald-700' },
    { action: 'complete', label: 'Terminer', icon: CheckCircle2, tone: 'bg-slate-900' },
    { action: 'reopen', label: 'Rouvrir', icon: RotateCcw, tone: 'bg-violet-700' },
  ],
  task: [
    { action: 'execute', label: 'Exécuter', icon: CirclePlay, tone: 'bg-blue-700' },
    { action: 'complete', label: 'Terminer', icon: CheckCircle2, tone: 'bg-emerald-700' },
    { action: 'retry', label: 'Réessayer', icon: RefreshCw, tone: 'bg-violet-700' },
    { action: 'cancel', label: 'Annuler', icon: XCircle, tone: 'bg-rose-700' },
  ],
  exception: [
    { action: 'retry', label: 'Réessayer', icon: RefreshCw, tone: 'bg-blue-700' },
    { action: 'close', label: 'Résoudre', icon: CheckCircle2, tone: 'bg-emerald-700' },
    { action: 'reopen', label: 'Rouvrir', icon: RotateCcw, tone: 'bg-violet-700' },
    { action: 'archive', label: 'Archiver', icon: Archive, tone: 'bg-slate-700' },
  ],
  strategy: [
    { action: 'activate', label: 'Publier', icon: CirclePlay, tone: 'bg-blue-700' },
    { action: 'execute', label: 'Compiler', icon: RefreshCw, tone: 'bg-violet-700' },
    { action: 'archive', label: 'Archiver', icon: Archive, tone: 'bg-slate-700' },
  ],
}

export default function LiveEntityActions({ entityType, entityId, compact = false }: { entityType: EntityType; entityId: string; compact?: boolean }) {
  const [busy, setBusy] = useState<Action | null>(null)
  const [message, setMessage] = useState('')

  async function run(action: Action) {
    const actionId = revenueActionId(`${entityType}-${action}`)
    const startedAt = new Date().toISOString()
    setBusy(action)
    setMessage('')
    emitRevenueAction({ id: actionId, title: `${definitions[entityType].find((item) => item.action === action)?.label || action} · ${entityType}`, workspace: entityType, state: 'running', step: 'Mutation opérationnelle', indeterminate: true, startedAt })
    try {
      const response = await fetch('/api/revenue-command-os/live-operations', {
        method: 'POST',
        headers: managedRevenueHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ entityType, entityId, operation: action, reason: `Action directe ${action}` }),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Action impossible')
      const result = body.data?.results?.[0]
      const state = body.data?.failed ? 'partial' : 'success'
      const completedAt = new Date().toISOString()
      const warningMessages = Array.isArray(body.data?.failures)
        ? body.data.failures.map((failure: { error?: string }) => failure.error || 'Échec partiel')
        : []
      setMessage(`${definitions[entityType].find((item) => item.action === action)?.label || action} terminé`)
      emitRevenueAction({
        id: actionId,
        title: `${action} · ${entityType}`,
        workspace: entityType,
        state,
        step: result?.status ? `État: ${result.status}` : 'État synchronisé',
        progress: 100,
        startedAt,
        completedAt,
        resultHref: window.location.pathname,
        auditHref: '/revenue-command-os/audit',
        warningCount: warningMessages.length || undefined,
        detail: warningMessages.length ? warningMessages.join(' · ') : undefined,
        dismissible: true,
      })
      window.dispatchEvent(new CustomEvent('revenue-os:operation-completed', { detail: body.data }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setMessage(errorMessage)
      emitRevenueAction({ id: actionId, title: `${action} · ${entityType}`, workspace: entityType, state: 'failure', step: 'Échec', startedAt, completedAt: new Date().toISOString(), error: errorMessage, dismissible: true })
    } finally {
      setBusy(null)
    }
  }

  return <div className="mt-4">
    <div className="flex flex-wrap gap-2">{definitions[entityType].map(({ action, label, icon: Icon, tone }) => <button key={action} type="button" onClick={() => void run(action)} disabled={Boolean(busy)} className={`${compact ? 'px-3 py-2 text-[10px]' : 'px-3.5 py-2.5 text-xs'} inline-flex items-center gap-2 rounded-xl font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50 ${tone}`}>{busy === action ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />} {label}</button>)}</div>
    {message ? <p className={`mt-2 text-[10px] font-bold ${/impossible|error|erreur|échec/i.test(message) ? 'text-rose-700' : 'text-emerald-700'}`}>{message}</p> : null}
  </div>
}
