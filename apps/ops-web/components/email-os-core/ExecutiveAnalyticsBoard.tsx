"use client"

import { useEffect, useState } from "react"
import { Activity, AlertTriangle, Archive, CheckCircle2, Inbox, ShieldCheck } from "lucide-react"

export default function ExecutiveAnalyticsBoard() {
  const [data, setData] = useState<any>({})

  async function load() {
    const res = await fetch("/api/email-os/analytics")
    const json = await res.json()
    setData(json.data || {})
  }

  useEffect(() => {
    load()
  }, [])

  const cards = [
    ["Mailboxes", data.mailboxes || 0, Inbox],
    ["Open Threads", data.threadsOpen || 0, Activity],
    ["Resolved", data.threadsResolved || 0, CheckCircle2],
    ["Escalated", data.threadsEscalated || 0, AlertTriangle],
    ["Queued", data.queuedMessages || 0, Archive],
    ["Pending Approvals", data.approvalsPending || 0, ShieldCheck]
  ] as const

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-black text-slate-950">
          Executive Analytics Board
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Real operational KPIs from Email-OS core.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <Icon className="h-5 w-5 text-slate-400" />
            <div className="mt-4 text-3xl font-black text-slate-950">
              {value}
            </div>
            <div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-400">
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
