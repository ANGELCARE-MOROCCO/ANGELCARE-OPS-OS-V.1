"use client"

import { useEffect, useState } from "react"
import { BarChart3, FileSpreadsheet, RefreshCw } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  })
  return res.json()
}

export default function AnalyticsReportingPanel() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")

  async function aggregate() {
    const result = await api("/api/email-os/analytics/aggregate", {
      method: "POST"
    })

    if (result.ok) {
      setMetrics(result.data || [])
      setStatus("Analytics refreshed")
    } else {
      setStatus(result.error || "Aggregation failed")
    }
  }

  async function snapshot() {
    const result = await api("/api/email-os/reporting/snapshot", {
      method: "POST"
    })

    setStatus(result.ok ? "Executive snapshot generated" : result.error || "Snapshot failed")
  }

  useEffect(() => {
    aggregate()
  }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <BarChart3 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-950">
                Executive Analytics
              </h2>
              <p className="text-sm text-slate-500">
                {status}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={aggregate}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              onClick={snapshot}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Snapshot
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.key}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="text-3xl font-black text-slate-950">
                {metric.value}
              </div>

              <div className="mt-2 text-xs font-black uppercase tracking-wide text-slate-500">
                {metric.key}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
