"use client"

import { useEffect, useState } from "react"
import { ArchiveRestore, FileWarning, Plus, RefreshCw, ShieldCheck } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function GovernancePanel() {
  const [policies, setPolicies] = useState<any[]>([])
  const [deleted, setDeleted] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [status, setStatus] = useState("Ready")

  async function load() {
    const [p, d, s] = await Promise.all([
      api("/api/email-os/governance/retention-policies"),
      api("/api/email-os/governance/deleted-records"),
      api("/api/email-os/governance/audit-summary")
    ])

    setPolicies(p.data || [])
    setDeleted(d.data || [])
    setSummary(s.data || null)
  }

  async function createPolicy() {
    const result = await api("/api/email-os/governance/retention-policies", {
      method: "POST",
      body: JSON.stringify({ entity: "threads", policyName: "Thread retention", retentionDays: 365 })
    })
    setStatus(result.ok ? "Policy created" : result.error || "Failed")
    await load()
  }

  async function recover(id: string) {
    const result = await api("/api/email-os/governance/recover", {
      method: "POST",
      body: JSON.stringify({ deletedRecordId: id })
    })
    setStatus(result.ok ? "Recovered" : result.error || "Recovery failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Governance Center</h2>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={createPolicy} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-800">
              <Plus className="h-4 w-4" /> New policy
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-2xl font-black">{policies.length}</div>
            <div className="text-xs font-black uppercase text-slate-400">Retention policies</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-2xl font-black">{deleted.length}</div>
            <div className="text-xs font-black uppercase text-slate-400">Deleted records</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-2xl font-black">{summary?.total || 0}</div>
            <div className="text-xs font-black uppercase text-slate-400">Audit events</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <FileWarning className="h-5 w-5" /> Retention Policies
          </h3>
          <div className="mt-4 space-y-3">
            {policies.length === 0 ? <div className="text-sm font-bold text-slate-500">No policies yet.</div> : null}
            {policies.map((policy) => (
              <div key={policy.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-950">{policy.policy_name}</div>
                <div className="text-sm text-slate-500">{policy.entity} • {policy.retention_days} days</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <ArchiveRestore className="h-5 w-5" /> Recovery Registry
          </h3>
          <div className="mt-4 space-y-3">
            {deleted.length === 0 ? <div className="text-sm font-bold text-slate-500">No deleted records captured.</div> : null}
            {deleted.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-950">{row.entity}:{row.record_id}</div>
                <div className="text-sm text-slate-500">{row.recovery_status}</div>
                {row.recovery_status === "recoverable" ? (
                  <button onClick={() => recover(row.id)} className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-xl bg-slate-950 px-3 text-sm font-bold text-white">
                    Recover
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
