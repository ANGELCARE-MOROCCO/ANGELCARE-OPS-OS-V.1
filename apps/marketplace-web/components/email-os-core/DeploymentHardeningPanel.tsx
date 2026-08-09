"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, RefreshCw, Server, ShieldCheck } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function DeploymentHardeningPanel() {
  const [provider, setProvider] = useState<any>(null)
  const [mailbox, setMailbox] = useState<any>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")

  async function load() {
    const [p, m, i, e] = await Promise.all([
      api("/api/email-os/production/provider-validation"),
      api("/api/email-os/production/mailbox-validation"),
      api("/api/email-os/production/deployment-incidents"),
      api("/api/email-os/production/monitoring-events")
    ])
    setProvider(p.data || p)
    setMailbox(m.data || m)
    setIncidents(i.data || [])
    setEvents(e.data || [])
  }

  async function logIncident() {
    const result = await api("/api/email-os/production/deployment-incidents", {
      method: "POST",
      body: JSON.stringify({
        incidentType: "manual",
        severity: "medium",
        title: "Manual deployment review item"
      })
    })
    setStatus(result.ok ? "Incident logged" : result.error || "Failed")
    await load()
  }

  async function logEvent() {
    const result = await api("/api/email-os/production/monitoring-events", {
      method: "POST",
      body: JSON.stringify({
        eventType: "deployment.review",
        severity: "info",
        title: "Deployment hardening review event"
      })
    })
    setStatus(result.ok ? "Monitoring event logged" : result.error || "Failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">Deployment Hardening</h1>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>
          <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <ShieldCheck className="h-5 w-5 text-slate-400" />
            <div className="mt-3 text-lg font-black text-slate-950">{provider?.status || "checking"}</div>
            <div className="text-xs font-black uppercase text-slate-400">Provider env</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <ShieldCheck className="h-5 w-5 text-slate-400" />
            <div className="mt-3 text-lg font-black text-slate-950">{mailbox?.status || "checking"}</div>
            <div className="text-xs font-black uppercase text-slate-400">Mailbox validation</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <AlertTriangle className="h-5 w-5 text-slate-400" />
            <div className="mt-3 text-3xl font-black text-slate-950">{incidents.length}</div>
            <div className="text-xs font-black uppercase text-slate-400">Incidents</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <Server className="h-5 w-5 text-slate-400" />
            <div className="mt-3 text-3xl font-black text-slate-950">{events.length}</div>
            <div className="text-xs font-black uppercase text-slate-400">Monitoring events</div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={logIncident} className="h-11 cursor-pointer rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">Log Incident</button>
          <button onClick={logEvent} className="h-11 cursor-pointer rounded-2xl border border-slate-200 px-4 text-sm font-black hover:bg-slate-50">Log Event</button>
        </div>
      </div>
    </section>
  )
}
