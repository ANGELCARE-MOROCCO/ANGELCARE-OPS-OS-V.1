"use client"

import { useEffect, useState } from "react"
import { Activity, AlertTriangle, Archive, CheckCircle2, Inbox, RefreshCw, ShieldCheck } from "lucide-react"

async function getMetrics() {
  const res = await fetch("/api/email-os/command-center")
  return res.json()
}

export default function EnterpriseCommandCenter() {
  const [metrics, setMetrics] = useState<Record<string, number>>({})
  const [status, setStatus] = useState("Ready")

  async function load() {
    setStatus("Refreshing...")
    const result = await getMetrics()
    if (result.ok) {
      setMetrics(result.data || {})
      setStatus("Live")
    } else {
      setStatus(result.error || "Failed")
    }
  }

  useEffect(() => { load() }, [])

  const cards = [
    ["Mailboxes", metrics.mailboxes || 0, Inbox],
    ["Open threads", metrics.openThreads || 0, Activity],
    ["Escalated", metrics.escalatedThreads || 0, AlertTriangle],
    ["Approvals", metrics.pendingApprovals || 0, ShieldCheck],
    ["Queued", metrics.queuedMessages || 0, Archive],
    ["Failed", metrics.failedMessages || 0, CheckCircle2]
  ] as const

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">Enterprise Command Center</h2>
          <p className="mt-1 text-sm text-slate-500">{status}</p>
        </div>
        <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <Icon className="h-4 w-4 text-slate-400" />
            <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
            <div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
