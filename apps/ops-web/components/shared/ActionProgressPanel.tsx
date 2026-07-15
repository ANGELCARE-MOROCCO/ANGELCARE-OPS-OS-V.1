'use client'

import { CheckCircle2, Circle, Clock3, Loader2, X, XCircle } from 'lucide-react'
import type { ActionProgressReport, ActionProgressStep } from '@/hooks/useActionProgress'

function statusIcon(step: ActionProgressStep) {
  if (step.status === 'done') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  if (step.status === 'failed') return <XCircle className="h-4 w-4 text-rose-600" />
  if (step.status === 'running') return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
  return <Circle className="h-4 w-4 text-slate-300" />
}

function formatDuration(ms?: number) {
  if (typeof ms !== 'number') return null
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export default function ActionProgressPanel({
  progress,
  onClose,
}: {
  progress: ActionProgressReport
  onClose: () => void
}) {
  if (progress.status === 'idle') return null

  const isSuccess = progress.status === 'success'
  const isError = progress.status === 'error'
  const duration = formatDuration(progress.durationMs)

  return (
    <div className="fixed inset-x-3 bottom-3 z-[9999] sm:inset-x-auto sm:right-5 sm:w-[440px]">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className={`h-1.5 ${isError ? 'bg-rose-500' : isSuccess ? 'bg-emerald-500' : 'bg-blue-600'}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Action Progress</div>
              <div className="mt-1 text-lg font-black tracking-[-0.02em] text-slate-950">{progress.title}</div>
              {progress.subtitle ? <div className="mt-1 text-sm font-medium text-slate-500">{progress.subtitle}</div> : null}
            </div>
            {progress.canClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close progress report"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="text-3xl font-black text-slate-950">{Math.round(progress.percent)}%</div>
            <div className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
              isError
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : isSuccess
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-blue-200 bg-blue-50 text-blue-700'
            }`}>
              {progress.status}
            </div>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isError ? 'bg-rose-500' : isSuccess ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-cyan-500'}`}
              style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{progress.currentStep || 'Processing'}</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">{progress.detail || 'Working…'}</div>
          </div>

          {progress.steps.length ? (
            <div className="mt-4 max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {progress.steps.map((step) => (
                <div key={step.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2">
                  <div className="mt-0.5">{statusIcon(step)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-bold text-slate-900">{step.label}</div>
                      <div className="text-xs font-black text-slate-400">{step.percent}%</div>
                    </div>
                    {step.detail ? <div className="mt-0.5 text-xs font-medium text-slate-500">{step.detail}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {(progress.summary || progress.error || duration) ? (
            <div className={`mt-4 rounded-2xl border px-3 py-3 text-sm ${
              isError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}>
              <div className="flex items-center gap-2 font-black">
                {isError ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {isError ? 'Action failed' : 'Action completed'}
              </div>
              <div className="mt-1 font-medium">{progress.error || progress.summary}</div>
              {duration ? (
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold opacity-80">
                  <Clock3 className="h-3.5 w-3.5" />
                  Duration: {duration}
                </div>
              ) : null}
            </div>
          ) : null}

          {progress.canClose ? (
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Close report
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
