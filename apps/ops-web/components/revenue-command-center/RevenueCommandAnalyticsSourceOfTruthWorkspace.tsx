"use client"

import { useEffect, useState } from "react"
import { Activity, BarChart3, Bell, CalendarDays, CheckCircle2, DatabaseZap, RefreshCcw, ShieldAlert, Target, Users } from "lucide-react"
import {
  loadRevenueCommandAnalytics,
  runRevenueSmokeTest,
  subscribeRevenueAnalytics,
  type RevenueCommandAnalytics,
} from "@/lib/revenue-command-center/revenue-command-analytics"

function mad(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M MAD`
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1000)}K MAD`
  return `${Math.round(value || 0)} MAD`
}

export default function RevenueCommandAnalyticsSourceOfTruthWorkspace() {
  const [analytics, setAnalytics] = useState<RevenueCommandAnalytics | null>(null)
  const [smoke, setSmoke] = useState<any>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  async function refresh() {
    setAnalytics(await loadRevenueCommandAnalytics())
    setLastSync(new Date())
  }

  useEffect(() => {
    void refresh()
    const unsubscribe = subscribeRevenueAnalytics(() => void refresh())
    return unsubscribe
  }, [])

  async function smokeTest() {
    setSmoke(await runRevenueSmokeTest())
  }

  return (
    <main className="rcc-shell-main w-full max-w-none min-w-0 flex-1 min-h-screen bg-[#050b16] p-4 text-white">
      <section className="w-full max-w-none min-w-0 ">
        <header className="mb-4 flex flex-col gap-4 rounded-[32px] border border-[#244365] bg-[#07111f]/90 p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Database analytics</div>
            <h1 className="mt-1 text-3xl font-black">Revenue Command Analytics</h1>
            <p className="mt-1 text-sm font-semibold text-[#cbd5e1]">Calculated from revenue_prospects, revenue_tasks, revenue_appointments, revenue_events and notifications.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void refresh()} className="rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black"><RefreshCcw className="mr-2 inline h-4 w-4" />Refresh</button>
            <button onClick={() => void smokeTest()} className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950">Smoke Test</button>
          </div>
        </header>

        {analytics ? (
          <section className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Kpi icon={<Users />} label="Prospects" value={String(analytics.total_prospects)} detail={`${analytics.active_prospects} active`} />
            <Kpi icon={<Target />} label="Pipeline" value={mad(Number(analytics.pipeline_value_mad))} detail="from revenue_prospects" />
            <Kpi icon={<CheckCircle2 />} label="Tasks" value={String(analytics.total_tasks)} detail={`${analytics.open_tasks} open · ${analytics.overdue_tasks} overdue`} />
            <Kpi icon={<CalendarDays />} label="Appointments" value={String(analytics.total_appointments)} detail={`${analytics.scheduled_appointments} scheduled · ${analytics.missed_appointments} missed`} />
            <Kpi icon={<Bell />} label="Unread Alerts" value={String(analytics.unread_notifications)} detail={`${analytics.total_events} events`} />
          </section>
        ) : (
          <div className="rounded-3xl border border-[#244365] bg-[#0e1e34] p-12 text-center font-bold text-[#cbd5e1]">Loading analytics...</div>
        )}

        <section className="mt-4 rounded-[32px] border border-[#244365] bg-[#0e1e34] p-5">
          <h2 className="text-xl font-black">QA / Smoke Test</h2>
          <p className="mt-1 text-sm font-semibold text-[#cbd5e1]">Last sync: {lastSync ? lastSync.toLocaleString() : "syncing"}</p>
          {smoke && <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#07111f] p-4 text-xs text-emerald-200">{JSON.stringify(smoke, null, 2)}</pre>}
        </section>
      </section>
    </main>
  )
}

function Kpi({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-[#244365] bg-[#07111f]/90 p-5"><div className="mb-3 text-cyan-300 [&_svg]:h-6 [&_svg]:w-6">{icon}</div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8]">{label}</div><div className="mt-1 text-2xl font-black">{value}</div><div className="truncate text-xs font-bold text-[#cbd5e1]">{detail}</div></div>
}
