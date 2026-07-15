"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Brain, Gauge, RefreshCw, ShieldAlert, Zap } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function CommandCenterIntelligencePanel() {
  const [summary, setSummary] = useState<any>({
    alerts: [],
    priorityScores: [],
    risks: [],
    bottlenecks: [],
    workloads: [],
    presence: []
  })
  const [status, setStatus] = useState("Ready")

  async function load() {
    const result = await api("/api/email-os/command-center/summary")
    setSummary(result.data || summary)
  }

  async function runIntelligence() {
    setStatus("Running command intelligence...")
    const [score, risk, bottlenecks] = await Promise.all([
      api("/api/email-os/intelligence/priority-score", { method: "POST" }),
      api("/api/email-os/intelligence/risk-classify", { method: "POST" }),
      api("/api/email-os/intelligence/bottlenecks", { method: "POST" })
    ])

    const errors = [score, risk, bottlenecks].filter((item) => !item.ok)
    setStatus(errors.length ? "Some intelligence jobs failed" : "Command intelligence completed")
    await load()
  }

  useEffect(() => { load() }, [])

  const cards = [
    ["Priority scores", summary.priorityScores?.length || 0, Gauge],
    ["Risk classifications", summary.risks?.length || 0, ShieldAlert],
    ["Bottlenecks", summary.bottlenecks?.length || 0, AlertTriangle],
    ["Workloads", summary.workloads?.length || 0, Zap],
    ["Presence", summary.presence?.length || 0, Brain]
  ] as const

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Email-OS Command Center Intelligence</h2>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={runIntelligence} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white">
              <Brain className="h-4 w-4" /> Run intelligence
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-5">
          {cards.map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Icon className="h-5 w-5 text-slate-400" />
              <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
              <div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Latest Risks</h3>
          <div className="mt-4 space-y-3">
            {summary.risks?.length === 0 ? <div className="text-sm font-bold text-slate-500">No risk classifications yet.</div> : null}
            {summary.risks?.slice(0, 8).map((risk: any) => (
              <div key={risk.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-950">{risk.risk_level}</div>
                <div className="mt-1 text-sm text-slate-500">{risk.risk_reason}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Bottlenecks</h3>
          <div className="mt-4 space-y-3">
            {summary.bottlenecks?.length === 0 ? <div className="text-sm font-bold text-slate-500">No bottlenecks yet.</div> : null}
            {summary.bottlenecks?.slice(0, 8).map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-950">{item.title}</div>
                <div className="mt-1 text-sm text-slate-500">{item.severity} • {item.count_value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Priority Scores</h3>
          <div className="mt-4 space-y-3">
            {summary.priorityScores?.length === 0 ? <div className="text-sm font-bold text-slate-500">No priority scores yet.</div> : null}
            {summary.priorityScores?.slice(0, 8).map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-950">{item.priority} • {item.score}</div>
                <div className="mt-1 text-sm text-slate-500">{item.thread_id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
