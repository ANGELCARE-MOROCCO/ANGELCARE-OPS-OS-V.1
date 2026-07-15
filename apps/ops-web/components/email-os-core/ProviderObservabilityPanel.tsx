"use client"

import { useEffect, useState } from "react"
import { Activity, RefreshCw } from "lucide-react"

export default function ProviderObservabilityPanel() {
  const [logs, setLogs] = useState<any[]>([])

  async function load() {
    const res = await fetch("/api/email-os/provider-logs")
    const json = await res.json()
    setLogs(json.data || [])
  }

  useEffect(() => { load() }, [])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">Provider Observability</h2>
            <p className="text-sm text-slate-500">SMTP/IMAP/cron provider logs.</p>
          </div>
        </div>
        <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-bold text-slate-500">
            No provider logs yet.
          </div>
        ) : null}

        {logs.map((log) => (
          <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-black text-slate-950">{log.provider} • {log.action}</div>
              <div className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-500">{log.status}</div>
            </div>
            {log.message ? <p className="mt-2 text-sm text-slate-600">{log.message}</p> : null}
            <div className="mt-2 text-xs text-slate-400">{log.created_at}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
