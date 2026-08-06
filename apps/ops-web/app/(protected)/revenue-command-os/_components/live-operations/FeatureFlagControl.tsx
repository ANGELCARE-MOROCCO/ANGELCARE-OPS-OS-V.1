'use client'

import { useState } from 'react'
import { Loader2, Power } from 'lucide-react'
import { emitRevenueAction, managedRevenueHeaders, revenueActionId } from '../action-center/action-events'

export default function FeatureFlagControl({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function toggle() {
    const id = revenueActionId(`feature-${flagKey}`)
    const startedAt = new Date().toISOString()
    setBusy(true)
    setMessage('')
    emitRevenueAction({ id, title: `${enabled ? 'Désactiver' : 'Activer'} ${flagKey}`, workspace: 'settings', state: 'running', step: 'Mise à jour de la capacité', indeterminate: true, startedAt })
    try {
      const response = await fetch('/api/revenue-command-os/settings', {
        method: 'POST',
        headers: managedRevenueHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action: 'feature-flag', flagKey, enabled: !enabled }),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Modification impossible')
      const nextMessage = !enabled ? 'Activée' : 'Désactivée'
      setMessage(nextMessage)
      emitRevenueAction({ id, title: `Capacité ${flagKey}`, workspace: 'settings', state: 'success', step: nextMessage, progress: 100, startedAt, completedAt: new Date().toISOString(), resultHref: window.location.pathname, auditHref: '/revenue-command-os/audit', dismissible: true })
      window.dispatchEvent(new CustomEvent('revenue-os:operation-completed', { detail: body.data }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setMessage(errorMessage)
      emitRevenueAction({ id, title: `Capacité ${flagKey}`, workspace: 'settings', state: 'failure', step: 'Échec', startedAt, completedAt: new Date().toISOString(), error: errorMessage, dismissible: true })
    } finally {
      setBusy(false)
    }
  }

  return <div className="mt-4"><button type="button" onClick={() => void toggle()} disabled={busy} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black text-white disabled:opacity-50 ${enabled ? 'bg-slate-700' : 'bg-emerald-700'}`}>{busy ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />} {enabled ? 'Désactiver' : 'Activer'}</button>{message ? <p className="mt-2 text-[10px] font-bold text-slate-600">{message}</p> : null}</div>
}
