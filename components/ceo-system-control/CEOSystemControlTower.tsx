'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeInfo,
  Clock3,
  Cpu,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  SignalHigh,
  Workflow,
} from 'lucide-react'

type RuntimeState = {
  id: string
  mode: string
  isSystemOnline: boolean
  shutdownStartedAt: string | null
  shutdownEndsAt: string | null
  resumeAt: string | null
  timezone: string
  reason: string | null
  authorizedRoles: string[]
  authorizedEmails: string[]
  disabledModules: Record<string, { disabled: boolean; updatedAt: string | null; pressure?: number; reason?: string | null; lastActivityAt?: string | null; scope?: string | null }>
  enabledCoreRoutes: string[]
  schedule: Record<string, unknown>
  lastActionBy: string | null
  lastActionAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

type SystemUsageResponse = {
  connected: { vercel: boolean; internal: boolean }
  vercel: { connected: boolean; source: string; message: string; data: any }
  state: RuntimeState
  summary: {
    activeCpu: number
    functionInvocations: number
    edgeRequests: number
    bandwidth: number
    errorRate: number
    topRoutePressure: string
    estimatedCostPressure: number
  }
  charts: {
    hourly: Array<{ label: string; value: number; cost: number; count: number }>
    daily: Array<{ label: string; value: number; cost: number; count: number }>
    weekly: Array<{ label: string; value: number; cost: number; count: number }>
    routePressure: Array<{ route: string; value: number }>
    modulePressure: Array<{ module: string; value: number }>
    shutdownHistory: Array<{ label: string; value: number; at: string; index: number; fromMode: string | null; toMode: string | null }>
  }
  metrics: { internalSnapshots: number; runtimeEvents: number }
}

type RuntimeEvent = {
  id: string
  event_type: string
  from_mode: string | null
  to_mode: string | null
  actor_email: string | null
  actor_role: string | null
  payload: Record<string, unknown>
  created_at: string
}

type ProgressStep = {
  percent: number
  key: string
  label: string
  detail: string
}

const DEFAULT_STATE: RuntimeState = {
  id: '',
  mode: 'normal',
  isSystemOnline: true,
  shutdownStartedAt: null,
  shutdownEndsAt: null,
  resumeAt: null,
  timezone: 'Africa/Casablanca',
  reason: null,
  authorizedRoles: ['ceo', 'admin'],
  authorizedEmails: [],
  disabledModules: {},
  enabledCoreRoutes: ['/ceo/system-control'],
  schedule: {},
  lastActionBy: null,
  lastActionAt: null,
  createdAt: null,
  updatedAt: null,
}

function toText(value: unknown) {
  if (value == null) return 'Not connected yet'
  const text = String(value).trim()
  return text || 'Not connected yet'
}

function formatDateTime(value: string | null, fallback = 'Not connected yet') {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value)
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function SimpleBars({ data, labelKey, valueKey, emptyLabel }: { data: Array<Record<string, any>>; labelKey: string; valueKey: string; emptyLabel: string }) {
  const max = Math.max(1, ...data.map((item) => Number(item[valueKey] || 0)))

  if (!data.length) {
    return <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-300">{emptyLabel}</div>
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((item) => {
        const value = Number(item[valueKey] || 0)
        return (
          <div key={String(item[labelKey])} className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-xs text-slate-300">
              <span className="truncate">{String(item[labelKey])}</span>
              <span className="font-semibold text-white">{formatNumber(value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{ width: `${(value / max) * 100}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MetricCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-[0_18px_48px_rgba(0,0,0,.22)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-black text-white">{value}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/8 p-3 text-amber-200">{icon}</div>
      </div>
      <div className="mt-3 text-sm leading-6 text-slate-300">{detail}</div>
    </div>
  )
}

export default function CEOSystemControlTower({
  initialState,
  initialUsage,
  initialEvents,
  operatorName,
}: {
  initialState: RuntimeState
  initialUsage: SystemUsageResponse | null
  initialEvents: RuntimeEvent[]
  operatorName: string | null
}) {
  const [state, setState] = useState<RuntimeState>(initialState || DEFAULT_STATE)
  const [usage, setUsage] = useState<SystemUsageResponse | null>(initialUsage)
  const [events, setEvents] = useState<RuntimeEvent[]>(initialEvents || [])
  const [loading, setLoading] = useState(false)
  const [progressSteps, setProgressSteps] = useState<ProgressStep[] | null>(null)
  const [activePercent, setActivePercent] = useState(0)
  const [activeStep, setActiveStep] = useState<string>('Idle')
  const [scheduleShutdownAt, setScheduleShutdownAt] = useState('')
  const [scheduleResumeAt, setScheduleResumeAt] = useState('')
  const [scheduleReason, setScheduleReason] = useState(state.reason || '')
  const [scheduleTimezone, setScheduleTimezone] = useState(state.timezone || 'Africa/Casablanca')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setScheduleReason(state.reason || '')
    setScheduleTimezone(state.timezone || 'Africa/Casablanca')
  }, [state.reason, state.timezone])

  useEffect(() => {
    let mounted = true

    const refresh = async () => {
      try {
        const [stateRes, usageRes, eventsRes] = await Promise.all([
          fetch('/api/system-control/state', { cache: 'no-store' }),
          fetch('/api/system-control/usage', { cache: 'no-store' }),
          fetch('/api/system-control/events?limit=40', { cache: 'no-store' }),
        ])

        if (!mounted) return

        if (stateRes.ok) {
          const payload = await stateRes.json()
          setState(payload.data.state)
        }

        if (usageRes.ok) {
          const payload = await usageRes.json()
          setUsage(payload)
        }

        if (eventsRes.ok) {
          const payload = await eventsRes.json()
          setEvents(payload.data || [])
        }
      } catch {
        // keep stale state and let the UI surface "Not connected yet"
      }
    }

    refresh()
    const timer = window.setInterval(refresh, 15000)
    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [])

  async function animateProgress(steps: ProgressStep[]) {
    setProgressSteps(steps)
    setActivePercent(0)
    setActiveStep(steps[0]?.label || 'Starting')

    for (const step of steps) {
      setActiveStep(step.label)
      setActivePercent(step.percent)
      // Small delay so the progress bar visibly advances.
      await new Promise((resolve) => window.setTimeout(resolve, 160))
    }
  }

  async function runAction(endpoint: '/api/system-control/shutdown' | '/api/system-control/restore' | '/api/system-control/schedule', body: Record<string, unknown>) {
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Action failed')
      }

      if (payload.state) setState(payload.state)
      if (payload.progress) await animateProgress(payload.progress)
      setMessage(payload.action === 'schedule' ? 'Schedule saved.' : `${payload.action} completed.`)
      if (payload.event) {
        setEvents((current) => [payload.event, ...current].slice(0, 40))
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  const summary = usage?.summary || {
    activeCpu: 0,
    functionInvocations: 0,
    edgeRequests: 0,
    bandwidth: 0,
    errorRate: 0,
    topRoutePressure: 'Not connected yet',
    estimatedCostPressure: 0,
  }

  const moduleCards = [
    { key: 'carelink_ops', label: 'CareLink Ops' },
    { key: 'carelink_mobile', label: 'CareLink Mobile' },
    { key: 'email-connect-voice', label: 'Email/Connect/Voice' },
    { key: 'dashboards', label: 'Dashboards' },
    { key: 'background_sync', label: 'Background Sync' },
    { key: 'live_polling', label: 'Live Polling' },
  ]

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,.18),_transparent_32%),linear-gradient(180deg,_#08101f_0%,_#040814_60%,_#02040a_100%)] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-amber-100">
                <ShieldCheck className="h-4 w-4" />
                CEO System Control Tower
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                ANGELCARE protected runtime control
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                The platform is monitored from a single runtime control plane. Use this tower to place the system in protected standby, restore normal mode, or schedule a safe transition.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Current mode</span>
                <span className="font-bold text-white">{state.mode}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Online</span>
                <span className={state.isSystemOnline ? 'font-bold text-emerald-300' : 'font-bold text-rose-300'}>{state.isSystemOnline ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Next restore</span>
                <span className="font-bold text-white">{state.resumeAt ? formatDateTime(state.resumeAt) : 'Not connected yet'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Last action</span>
                <span className="font-bold text-white">{state.lastActionAt ? formatDateTime(state.lastActionAt) : 'Not connected yet'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Operator</span>
                <span className="font-bold text-white">{operatorName || state.lastActionBy || 'Not connected yet'}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<Cpu className="h-5 w-5" />} label="Active CPU" value={formatNumber(summary.activeCpu)} detail={usage?.vercel.connected ? 'Connected to Vercel usage telemetry.' : 'Vercel usage API not connected yet. Using internal snapshots only.'} />
          <MetricCard icon={<Activity className="h-5 w-5" />} label="Function Invocations" value={formatNumber(summary.functionInvocations)} detail="Internal snapshot roll-up for control tower visibility." />
          <MetricCard icon={<SignalHigh className="h-5 w-5" />} label="Edge Requests" value={formatNumber(summary.edgeRequests)} detail="Route pressure count from stored snapshots or not connected yet." />
          <MetricCard icon={<Gauge className="h-5 w-5" />} label="Estimated Cost Pressure" value={`MAD ${formatNumber(summary.estimatedCostPressure)}`} detail={`Top route pressure: ${toText(summary.topRoutePressure)}`} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Usage and pressure</h2>
                <p className="mt-1 text-sm text-slate-300">Live charts are driven by internal snapshots; Vercel metrics appear only when the server-side usage API is connected.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                {usage?.vercel.connected ? 'Vercel connected' : 'Vercel usage API not connected yet'}
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Hourly usage</div>
                <SimpleBars data={usage?.charts.hourly || []} labelKey="label" valueKey="value" emptyLabel="Hourly usage not connected yet." />
              </div>
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Daily usage</div>
                <SimpleBars data={usage?.charts.daily || []} labelKey="label" valueKey="value" emptyLabel="Daily usage not connected yet." />
              </div>
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Weekly usage</div>
                <SimpleBars data={usage?.charts.weekly || []} labelKey="label" valueKey="value" emptyLabel="Weekly usage not connected yet." />
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Route pressure</div>
                <SimpleBars data={usage?.charts.routePressure || []} labelKey="route" valueKey="value" emptyLabel="Route pressure not connected yet." />
              </div>
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Module pressure</div>
                <SimpleBars data={usage?.charts.modulePressure || []} labelKey="module" valueKey="value" emptyLabel="Module pressure not connected yet." />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Shutdown and restore workflow</h2>
                <p className="mt-1 text-sm text-slate-300">The command center emits detailed transition steps from 0% to 100%.</p>
              </div>
              <Workflow className="h-5 w-5 text-amber-200" />
            </div>

            <div className="mt-5 space-y-4">
              <button disabled={loading} onClick={() => runAction('/api/system-control/shutdown', { command: 'shutdown_now', reason: scheduleReason, resumeAt: scheduleResumeAt || null, timezone: scheduleTimezone })} className="flex w-full items-center justify-between rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-left text-sm font-bold text-amber-50 transition hover:bg-amber-300/15 disabled:opacity-60">
                <span className="flex items-center gap-2"><ArrowDownCircle className="h-4 w-4" /> Shutdown now</span>
                <span>Protected standby</span>
              </button>
              <button disabled={loading} onClick={() => runAction('/api/system-control/restore', { command: 'restore_now', reason: scheduleReason, timezone: scheduleTimezone })} className="flex w-full items-center justify-between rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-left text-sm font-bold text-emerald-50 transition hover:bg-emerald-300/15 disabled:opacity-60">
                <span className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4" /> Restore now</span>
                <span>Back online</span>
              </button>
              <button disabled={loading} onClick={() => runAction('/api/system-control/shutdown', { command: 'emergency_lock', reason: scheduleReason || 'Emergency lock', resumeAt: scheduleResumeAt || null, timezone: scheduleTimezone })} className="flex w-full items-center justify-between rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-left text-sm font-bold text-rose-50 transition hover:bg-rose-300/15 disabled:opacity-60">
                <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Emergency lock</span>
                <span>Freeze access</span>
              </button>
              <div className="grid gap-3 md:grid-cols-2">
                <button disabled={loading} onClick={() => runAction('/api/system-control/shutdown', { command: 'disable_polling_only', reason: scheduleReason || 'Polling only', timezone: scheduleTimezone })} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-60">
                  Disable polling only
                </button>
                <button disabled={loading} onClick={() => runAction('/api/system-control/shutdown', { command: 'disable_heavy_sync_only', reason: scheduleReason || 'Heavy sync only', timezone: scheduleTimezone })} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-60">
                  Disable heavy sync only
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-white">Progress</div>
                  <div className="text-xs text-slate-400">{activeStep}</div>
                </div>
                <div className="text-2xl font-black text-amber-200">{Math.round(activePercent)}%</div>
              </div>
              <div className="mt-3">
                <ProgressBar value={activePercent} />
              </div>
              <div className="mt-4 grid gap-2">
                {(progressSteps || []).map((step) => (
                  <div key={step.key} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-[11px] font-black text-amber-100">{step.percent}</div>
                    <div>
                      <div className="text-sm font-semibold text-white">{step.label}</div>
                      <div className="text-xs leading-5 text-slate-400">{step.detail}</div>
                    </div>
                  </div>
                ))}
                {!progressSteps?.length && (
                  <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-3 text-sm text-slate-300">
                    No active transition. System is waiting for a command.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Reason</span>
                <input value={scheduleReason} onChange={(event) => setScheduleReason(event.target.value)} placeholder="Enter operating reason" className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Timezone</span>
                <input value={scheduleTimezone} onChange={(event) => setScheduleTimezone(event.target.value)} placeholder="Africa/Casablanca" className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Shutdown at</span>
                <input value={scheduleShutdownAt} onChange={(event) => setScheduleShutdownAt(event.target.value)} type="datetime-local" className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none ring-0" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Resume at</span>
                <input value={scheduleResumeAt} onChange={(event) => setScheduleResumeAt(event.target.value)} type="datetime-local" className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none ring-0" />
              </label>
            </div>

            <button
              disabled={loading}
              onClick={() => runAction('/api/system-control/schedule', {
                shutdownAt: scheduleShutdownAt || null,
                resumeAt: scheduleResumeAt || null,
                timezone: scheduleTimezone,
                reason: scheduleReason || null,
              })}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100 disabled:opacity-60"
            >
              <Clock3 className="h-4 w-4" />
              Schedule shutdown / restore
            </button>

            {(message || error) && (
              <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${error ? 'border-rose-300/20 bg-rose-300/10 text-rose-100' : 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'}`}>
                {error || message}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Module control grid</h2>
                <p className="mt-1 text-sm text-slate-300">Module status is derived from runtime state. Button support is intentionally limited to the command center to avoid accidental drift.</p>
              </div>
              <BadgeInfo className="h-5 w-5 text-sky-200" />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {moduleCards.map((module) => {
                const details = state.disabledModules[module.key] || { disabled: false, updatedAt: null, pressure: 0, reason: null, lastActivityAt: null, scope: null }
                return (
                  <div key={module.key} className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-black text-white">{module.label}</div>
                        <div className="mt-1 text-xs text-slate-400">{details.scope || 'Core module'}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-bold ${details.disabled ? 'bg-rose-300/15 text-rose-100' : 'bg-emerald-300/15 text-emerald-100'}`}>
                        {details.disabled ? 'Disabled' : 'Enabled'}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-xs text-slate-300">
                      <div className="flex items-center justify-between gap-3">
                        <span>Last activity</span>
                        <span className="font-semibold text-white">{details.lastActivityAt ? formatDateTime(details.lastActivityAt) : 'Not connected yet'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Request pressure</span>
                        <span className="font-semibold text-white">{formatNumber(details.pressure || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Updated</span>
                        <span className="font-semibold text-white">{details.updatedAt ? formatDateTime(details.updatedAt) : 'Not connected yet'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Runtime audit stream</h2>
                <p className="mt-1 text-sm text-slate-300">Events are written server-side only. Nothing in this panel reveals secrets or tokens.</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-200" />
            </div>

            <div className="mt-5 space-y-3">
              {events.length ? events.slice(0, 8).map((event) => (
                <div key={event.id} className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-bold text-white">{event.event_type.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-slate-400">{formatDateTime(event.created_at)}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                    <span className="rounded-full bg-white/5 px-2 py-1">from: {toText(event.from_mode)}</span>
                    <span className="rounded-full bg-white/5 px-2 py-1">to: {toText(event.to_mode)}</span>
                    <span className="rounded-full bg-white/5 px-2 py-1">actor: {toText(event.actor_email)}</span>
                    <span className="rounded-full bg-white/5 px-2 py-1">role: {toText(event.actor_role)}</span>
                  </div>
                </div>
              )) : (
                <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5 text-sm text-slate-300">
                  No runtime events yet. The system is ready for the first protected transition.
                </div>
              )}
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/45 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-bold text-white">Execution notes</div>
                <SignalHigh className="h-4 w-4 text-cyan-200" />
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-300">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> CEO/admin authorization is checked on every system-control API.</div>
                <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-rose-300" /> Normal users are redirected to the protected standby page while the system is offline.</div>
                <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-sky-300" /> Internal snapshots are used when Vercel usage telemetry is not connected yet.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
