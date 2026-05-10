"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Plus, ShieldCheck, XCircle } from "lucide-react"

async function req(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function ApprovalsPanel() {
  const [rows, setRows] = useState<any[]>([])
  const [status, setStatus] = useState("Ready")

  async function load() {
    const result = await req("/api/email-os/approvals")
    setRows(result.ok ? result.data || [] : [])
  }

  useEffect(() => { load() }, [])

  async function create() {
    const result = await req("/api/email-os/approvals", {
      method: "POST",
      body: JSON.stringify({ targetType: "manual", targetId: "manual", title: "Manual approval request" })
    })
    setStatus(result.ok ? "Approval created" : result.error || "Failed")
    await load()
  }

  async function decide(id: string, decision: "approved" | "rejected") {
    const result = await req(`/api/email-os/approvals/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision })
    })
    setStatus(result.ok ? decision : result.error || "Decision failed")
    await load()
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">Approvals</h2>
          <p className="mt-1 text-sm text-slate-500">{status}</p>
        </div>
        <button onClick={create} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white hover:bg-slate-800">
          <Plus className="h-4 w-4" /> New approval
        </button>
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        {rows.length === 0 ? <div className="py-8 text-center text-sm font-bold text-slate-500">No approvals yet.</div> : null}
        {rows.map((row) => (
          <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <div className="font-black text-slate-950">{row.title}</div>
              <div className="text-xs text-slate-500">{row.status} • {row.target_type}:{row.target_id}</div>
            </div>
            {row.status === "pending" ? (
              <div className="flex gap-2">
                <button onClick={() => decide(row.id, "approved")} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </button>
                <button onClick={() => decide(row.id, "rejected")} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-bold text-rose-700">
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            ) : <ShieldCheck className="h-5 w-5 text-slate-400" />}
          </div>
        ))}
      </div>
    </section>
  )
}
