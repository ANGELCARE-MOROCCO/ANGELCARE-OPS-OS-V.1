'use client'

import { useEffect, useMemo, useState } from 'react'
import { reportMarketOsRuntimeAudit, runMarketOsRuntimeAudit, type MarketOsRuntimeAudit } from '@/lib/market-os/execution-guard'

type Health = {
  ok?: boolean
  counters?: Record<string, number>
  checks?: Array<{ table: string; ok: boolean; count?: number; error?: string | null }>
  latest_runtime_audit?: MarketOsRuntimeAudit | null
  latest_static_audit?: any
}

export default function MarketOsFinalExecutionGuard() {
  const [audit, setAudit] = useState<MarketOsRuntimeAudit | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const isMarketOs = useMemo(() => typeof window !== 'undefined' && window.location.pathname.includes('/market-os'), [])

  async function runCheck() {
    if (!isMarketOs) return
    setBusy(true)
    try {
      const nextAudit = runMarketOsRuntimeAudit(document)
      setAudit(nextAudit)
      await reportMarketOsRuntimeAudit(nextAudit).catch(() => null)
      const res = await fetch('/api/market-os/final-execution-audit')
      const json = await res.json().catch(() => null)
      setHealth(json?.data || json)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!isMarketOs) return
    const timer = window.setTimeout(runCheck, 900)
    return () => window.clearTimeout(timer)
  }, [isMarketOs])

  if (!isMarketOs) return null

  const suspectCount = audit?.suspectButtons?.length || 0
  const ok = Boolean(audit?.ok && health?.ok)

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-[420px] font-sans">
      <button
        type="button"
        data-market-action="final-execution-guard-toggle"
        onClick={() => setOpen((v) => !v)}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-xl transition hover:shadow-2xl"
      >
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Market-OS Final Lock</div>
        <div className="mt-1 text-sm font-black text-slate-900">
          {busy ? 'Checking execution…' : ok ? 'Execution QA passing' : `${suspectCount} suspect button${suspectCount === 1 ? '' : 's'}`}
        </div>
      </button>

      {open && (
        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-black text-slate-950">Final production execution audit</div>
              <div className="mt-1 text-xs text-slate-500">Runtime scan + DB/API health + audit persistence.</div>
            </div>
            <button
              type="button"
              data-market-action="final-execution-guard-refresh"
              onClick={runCheck}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Recheck
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-lg font-black text-slate-950">{audit?.totalButtons ?? '—'}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Buttons</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-lg font-black text-slate-950">{suspectCount}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Suspect</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-lg font-black text-slate-950">{health?.ok ? 'OK' : 'Check'}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">DB/API</div>
            </div>
          </div>

          {audit?.suspectButtons?.length ? (
            <div className="mt-4 max-h-52 overflow-auto rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs font-black text-amber-900">Buttons requiring verification</div>
              <div className="mt-2 space-y-2">
                {audit.suspectButtons.slice(0, 8).map((item, index) => (
                  <div key={`${item.selector}-${index}`} className="text-xs text-amber-900">
                    <span className="font-bold">{item.text}</span>
                    <div className="text-[10px] text-amber-700">{item.selector}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
              Runtime scan did not detect suspect static buttons on this page.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
