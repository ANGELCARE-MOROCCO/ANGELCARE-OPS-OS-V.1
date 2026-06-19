'use client'

import { useEffect, useState } from 'react'
import { Mic2, Power, RefreshCw, ShieldCheck } from 'lucide-react'
import ActionProgressPanel from '@/components/shared/ActionProgressPanel'
import { useActionProgress } from '@/hooks/useActionProgress'

type ModuleFlag = {
  module_key: string
  module_label: string
  enabled: boolean
  status: string
  reason?: string | null
  last_action?: string | null
  updated_at?: string | null
  updated_by_email?: string | null
}

export default function VoiceTerminalRuntimeControl() {
  const [flag, setFlag] = useState<ModuleFlag | null>(null)
  const [reason, setReason] = useState('')
  const progress = useActionProgress()

  async function load(showProgress = false) {
    if (showProgress) {
      progress.startAction({
        title: 'Refresh Voice Terminal Control',
        subtitle: 'Checking current runtime module status.',
        steps: [
          { id: 'load', label: 'Load module flag', percent: 70 },
          { id: 'complete', label: 'Control ready', percent: 100 },
        ],
      })
    }

    try {
      if (showProgress) progress.setStep('load', 'running', 'Loading runtime flag…', 70)

      const response = await fetch('/api/system-control/module-flags/voice_terminal', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Unable to load Voice Terminal flag.')
      }

      setFlag(payload.data)
      setReason(payload.data?.reason || '')

      if (showProgress) progress.completeAction('Voice Terminal runtime status loaded.')
    } catch (error) {
      if (showProgress) progress.failAction(error instanceof Error ? error.message : 'Unable to refresh Voice Terminal control.')
    }
  }

  useEffect(() => {
    void load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function update(enabled: boolean) {
    progress.startAction({
      title: enabled ? 'Restore Voice Terminal' : 'Disable Voice Terminal',
      subtitle: enabled ? 'Restoring the global widget for users.' : 'Temporarily shutting down the global widget.',
      steps: [
        { id: 'validate', label: 'Validate CEO action', percent: 20 },
        { id: 'update', label: 'Update runtime flag', percent: 75 },
        { id: 'refresh', label: 'Refresh control state', percent: 95 },
        { id: 'complete', label: 'Action completed', percent: 100 },
      ],
    })

    try {
      progress.setStep('validate', 'done', 'CEO action validated.', 20)
      progress.setStep('update', 'running', 'Updating Voice Terminal runtime flag…', 75)

      const response = await fetch('/api/system-control/module-flags/voice_terminal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          reason: reason || (enabled ? 'Voice Terminal restored by CEO.' : 'Voice Terminal temporarily disabled by CEO.'),
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Unable to update Voice Terminal.')
      }

      setFlag(payload.data)

      progress.setStep('refresh', 'running', 'Refreshing runtime status…', 95)
      await load(false)

      progress.completeAction(enabled ? 'Voice Terminal restored successfully.' : 'Voice Terminal disabled successfully.', {
        module: 'voice_terminal',
        status: enabled ? 'active' : 'disabled',
      })
    } catch (error) {
      progress.failAction(error instanceof Error ? error.message : 'Unable to update Voice Terminal.')
    }
  }

  const enabled = flag?.enabled !== false

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <ActionProgressPanel progress={progress.progress} onClose={progress.closeProgress} />

      <div className={`absolute inset-x-0 top-0 h-1.5 ${enabled ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-100/70 blur-3xl" />

      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-700">
            <Mic2 className="h-4 w-4" />
            Voice Terminal Runtime Control
          </div>

          <h3 className="mt-3 text-3xl font-black tracking-[-0.06em] text-slate-950">
            Voice Terminal is {enabled ? 'active' : 'disabled'}
          </h3>

          <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600">
            Control the global Voice Terminal widget without redeploying. When disabled, the widget disappears from user screens and can be restored here.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
              enabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}>
              {enabled ? 'Active' : 'Disabled'}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Last action: {flag?.last_action || '—'}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              By: {flag?.updated_by_email || 'system'}
            </span>
          </div>
        </div>

        <div className="flex min-w-[260px] flex-col gap-2">
          <button
            type="button"
            onClick={() => void load(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh status
          </button>

          {enabled ? (
            <button
              type="button"
              onClick={() => void update(false)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(225,29,72,0.22)] hover:bg-rose-700"
            >
              <Power className="h-4 w-4" />
              Disable temporarily
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void update(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(5,150,105,0.20)] hover:bg-emerald-700"
            >
              <ShieldCheck className="h-4 w-4" />
              Restore Voice Terminal
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-5">
        <label className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
          Reason / CEO note
        </label>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Example: Temporary shutdown during UI stabilization."
          className="mt-2 min-h-[90px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </section>
  )
}
