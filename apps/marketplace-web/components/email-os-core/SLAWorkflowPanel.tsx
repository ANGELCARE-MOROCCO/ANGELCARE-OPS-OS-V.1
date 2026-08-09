"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ArrowUpCircle, RefreshCw } from "lucide-react"

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

export default function SLAWorkflowPanel() {
  const [status, setStatus] = useState("Ready")
  const [metrics, setMetrics] = useState({
    incidents: 0,
    breached: 0,
    escalations: 0
  })

  async function evaluate() {
    const result = await api("/api/email-os/sla/evaluate", {
      method: "POST"
    })

    if (result.ok) {
      setMetrics((prev) => ({
        ...prev,
        incidents: result.data.incidents,
        breached: result.data.breached
      }))

      setStatus("SLA evaluation completed")
    } else {
      setStatus(result.error || "Evaluation failed")
    }
  }

  async function escalate() {
    const result = await api("/api/email-os/workflows/escalate", {
      method: "POST"
    })

    if (result.ok) {
      setMetrics((prev) => ({
        ...prev,
        escalations: result.data.escalations
      }))

      setStatus("Escalations executed")
    } else {
      setStatus(result.error || "Escalation failed")
    }
  }

  useEffect(() => {
    evaluate()
  }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black text-slate-950">
                SLA + Workflow Operations
              </h2>

              <p className="text-sm text-slate-500">
                {status}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={evaluate}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Evaluate
            </button>

            <button
              onClick={escalate}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Escalate
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-3xl font-black text-slate-950">
              {metrics.incidents}
            </div>

            <div className="mt-2 text-xs font-black uppercase tracking-wide text-slate-500">
              SLA Incidents
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-3xl font-black text-red-600">
              {metrics.breached}
            </div>

            <div className="mt-2 text-xs font-black uppercase tracking-wide text-slate-500">
              Breached
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-3xl font-black text-slate-950">
              {metrics.escalations}
            </div>

            <div className="mt-2 text-xs font-black uppercase tracking-wide text-slate-500">
              Escalations
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
