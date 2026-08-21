'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

type Snapshot = Record<string, any>

function bytes(value: unknown) {
  const numeric = Number(value || 0)

  if (!Number.isFinite(numeric)) return '—'

  if (numeric >= 1024 ** 3) {
    return `${(numeric / 1024 ** 3).toFixed(2)} GiB`
  }

  if (numeric >= 1024 ** 2) {
    return `${(numeric / 1024 ** 2).toFixed(1)} MiB`
  }

  if (numeric >= 1024) {
    return `${(numeric / 1024).toFixed(1)} KiB`
  }

  return `${numeric} B`
}

function tone(pressure: string) {
  if (pressure === 'critical') {
    return 'border-rose-300 bg-rose-50 text-rose-900'
  }

  if (pressure === 'saturated') {
    return 'border-amber-300 bg-amber-50 text-amber-900'
  }

  if (pressure === 'elevated') {
    return 'border-yellow-300 bg-yellow-50 text-yellow-900'
  }

  return 'border-emerald-300 bg-emerald-50 text-emerald-900'
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string | number
  detail?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-black text-slate-950">
        {value}
      </div>
      {detail ? (
        <div className="mt-1 text-xs font-semibold text-slate-500">
          {detail}
        </div>
      ) : null}
    </div>
  )
}

export default function PerformanceCapacityCockpit() {
  const [snapshot, setSnapshot] =
    useState<Snapshot | null>(null)
  const [error, setError] =
    useState('')
  const [loading, setLoading] =
    useState(true)

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        '/api/opsos-control-plane/performance',
        {
          cache: 'no-store',
        },
      )

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        )
      }

      setSnapshot(await response.json())
      setError('')
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : 'Performance telemetry unavailable.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()

    const timer = window.setInterval(
      () => void load(),
      5_000,
    )

    return () => window.clearInterval(timer)
  }, [load])

  const classRows = useMemo(
    () => Object.entries(
      snapshot?.governor?.metrics?.classes || {},
    ),
    [snapshot],
  )

  const operations =
    snapshot?.governor?.metrics?.operations || []

  const queue = snapshot?.emailQueue || {}
  const memory = snapshot?.containerMemory || {}
  const redis = snapshot?.redis || {}
  const eventLoop = snapshot?.eventLoop || {}
  const pressure = snapshot?.pressure || 'unknown'

  return (
    <main className="min-h-screen bg-slate-50 p-5 text-slate-950 md:p-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              AngelCare SaaS Ops · Phase II
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
              Performance & Capacity Control Plane
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600">
              Live pressure, Redis coordination, execution budgets, queue backlog and event-loop health. No Docker socket is exposed to this application.
            </p>
          </div>

          <div className={`rounded-2xl border px-5 py-3 ${tone(pressure)}`}>
            <div className="text-[11px] font-black uppercase tracking-[0.16em]">
              System pressure
            </div>
            <div className="mt-1 text-xl font-black uppercase">
              {loading ? 'LOADING' : pressure}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
            Telemetry error: {error}
          </div>
        ) : null}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            label="Container memory"
            value={`${Number(memory.percent || 0).toFixed(1)}%`}
            detail={`${bytes(memory.currentBytes)} / ${bytes(memory.limitBytes)}`}
          />
          <MetricCard
            label="Process RSS"
            value={bytes(snapshot?.process?.rssBytes)}
            detail={`heap ${bytes(snapshot?.process?.heapUsedBytes)}`}
          />
          <MetricCard
            label="Event loop p95"
            value={`${Number(eventLoop.p95Ms || 0).toFixed(1)} ms`}
            detail={`p99 ${Number(eventLoop.p99Ms || 0).toFixed(1)} ms`}
          />
          <MetricCard
            label="Redis"
            value={redis.ok ? 'READY' : 'UNAVAILABLE'}
            detail={`${redis.latencyMs ?? '—'} ms · ${bytes(redis.memoryUsedBytes)}`}
          />
          <MetricCard
            label="Queued email"
            value={queue.queued ?? '—'}
            detail={`retry ${queue.retry ?? '—'} · processing ${queue.processing ?? '—'}`}
          />
          <MetricCard
            label="Failed email"
            value={queue.failed ?? '—'}
            detail={queue.ok === false ? 'queue telemetry degraded' : 'durable DB queue'}
          />
        </section>

        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Execution budgets</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Distributed concurrency permits by workload class.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Refresh now
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4">Class</th>
                  <th className="py-3 pr-4">Active</th>
                  <th className="py-3 pr-4">Peak</th>
                  <th className="py-3 pr-4">Admitted</th>
                  <th className="py-3 pr-4">Busy</th>
                  <th className="py-3 pr-4">Unavailable</th>
                  <th className="py-3 pr-4">p95 duration</th>
                </tr>
              </thead>
              <tbody>
                {classRows.length ? classRows.map(([name, value]: any) => (
                  <tr key={name} className="border-b border-slate-100 font-semibold">
                    <td className="py-3 pr-4 font-black uppercase">{name}</td>
                    <td className="py-3 pr-4">{value.active}</td>
                    <td className="py-3 pr-4">{value.peakActive}</td>
                    <td className="py-3 pr-4">{value.admitted}</td>
                    <td className="py-3 pr-4">{value.busy}</td>
                    <td className="py-3 pr-4">{value.unavailable}</td>
                    <td className="py-3 pr-4">{value.duration?.p95Ms || 0} ms</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center font-semibold text-slate-500">
                      No governed execution has been observed in this process yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Top governed operations</h2>
            <div className="mt-4 space-y-3">
              {operations.length ? operations.slice(0, 12).map((item: any) => (
                <div key={item.operation} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="break-all text-xs font-black text-slate-800">{item.operation}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-bold text-slate-500">
                    <span>{item.workloadClass}</span>
                    <span>admitted {item.admitted}</span>
                    <span>busy {item.busy}</span>
                    <span>failed {item.failed}</span>
                    <span>avg {item.averageDurationMs} ms</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm font-semibold text-slate-500">No operation metrics yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Capacity doctrine</h2>
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
              <p><b className="text-slate-900">Interactive:</b> preserve operator responsiveness first.</p>
              <p><b className="text-slate-900">Heavy & AI:</b> strict distributed concurrency to prevent CPU/RAM starvation.</p>
              <p><b className="text-slate-900">Workers:</b> duplicate-sensitive work fails closed when Redis coordination is unavailable.</p>
              <p><b className="text-slate-900">Durability:</b> Postgres/Supabase remains business truth; Redis remains ephemeral coordination.</p>
              <p><b className="text-slate-900">Host telemetry:</b> Docker/host control is deliberately not exposed to this web application.</p>
            </div>
          </div>
        </section>

        <div className="mt-7 text-xs font-semibold text-slate-400">
          Generated {snapshot?.generatedAt || '—'} · process uptime {snapshot?.process?.uptimeSeconds || 0}s
        </div>
      </div>
    </main>
  )
}
