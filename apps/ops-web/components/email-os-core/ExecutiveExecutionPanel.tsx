"use client"

import { useEffect, useState } from "react"
import { Play, RefreshCw, ShieldCheck, Zap } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function ExecutiveExecutionPanel() {
  const [actions, setActions] = useState<any[]>([])
  const [interventions, setInterventions] = useState<any[]>([])
  const [threads, setThreads] = useState<any[]>([])
  const [selectedThread, setSelectedThread] = useState("")
  const [status, setStatus] = useState("Ready")

  async function load() {
    const [a, i, t] = await Promise.all([
      api("/api/email-os/executive/actions"),
      api("/api/email-os/executive/interventions"),
      api("/api/email-os/entities/threads")
    ])
    setActions(a.data || [])
    setInterventions(i.data || [])
    setThreads(t.data || [])
    if (!selectedThread && (t.data || [])[0]) setSelectedThread(t.data[0].id)
  }

  async function createAction(actionType: string) {
    if (!selectedThread) return setStatus("Select thread first")
    const result = await api("/api/email-os/executive/actions", {
      method: "POST",
      body: JSON.stringify({
        actionType,
        targetType: "thread",
        targetId: selectedThread,
        payload: { owner: "executive-office" }
      })
    })
    setStatus(result.ok ? "Executive action queued" : result.error || "Failed")
    await load()
  }

  async function executeAction(id: string) {
    const result = await api(`/api/email-os/executive/actions/${id}/execute`, { method: "POST" })
    setStatus(result.ok ? "Executive action executed" : result.error || "Execution failed")
    await load()
  }

  async function runPolicy() {
    const result = await api("/api/email-os/executive/run-policy-execution", { method: "POST" })
    setStatus(result.ok ? "Policy execution completed" : result.error || "Policy failed")
    await load()
  }

  async function logIntervention() {
    if (!selectedThread) return setStatus("Select thread first")
    const result = await api("/api/email-os/executive/interventions", {
      method: "POST",
      body: JSON.stringify({
        interventionType: "executive_review",
        targetType: "thread",
        targetId: selectedThread,
        notes: "Executive intervention logged"
      })
    })
    setStatus(result.ok ? "Intervention logged" : result.error || "Failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-3 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Executive Execution Engine</h2>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>
          <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <select value={selectedThread} onChange={(e) => setSelectedThread(e.target.value)} className="h-11 min-w-[260px] rounded-2xl border border-slate-200 px-3 text-sm font-bold">
            <option value="">Select thread</option>
            {threads.map((thread) => <option key={thread.id} value={thread.id}>{thread.subject || thread.id}</option>)}
          </select>
          <button onClick={() => createAction("assign_thread")} className="inline-flex h-11 cursor-pointer items-center rounded-2xl border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50">Queue Assign</button>
          <button onClick={() => createAction("escalate_thread")} className="inline-flex h-11 cursor-pointer items-center rounded-2xl border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50">Queue Escalate</button>
          <button onClick={logIntervention} className="inline-flex h-11 cursor-pointer items-center rounded-2xl bg-indigo-700 px-4 text-sm font-bold text-white">Log Intervention</button>
          <button onClick={runPolicy} className="inline-flex h-11 cursor-pointer items-center rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white">Run Policy</button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-black">{actions.length}</div><div className="text-xs font-black uppercase text-slate-400">Actions</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-black">{interventions.length}</div><div className="text-xs font-black uppercase text-slate-400">Interventions</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-black">{actions.filter((a) => a.command_status === "queued").length}</div><div className="text-xs font-black uppercase text-slate-400">Queued</div></div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Executive Actions</h3>
        <div className="mt-4 space-y-3">
          {actions.length === 0 ? <div className="text-sm font-bold text-slate-500">No executive actions yet.</div> : null}
          {actions.slice(0, 20).map((action) => (
            <div key={action.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <div className="font-black text-slate-950">{action.action_type} • {action.command_status}</div>
                <div className="text-sm text-slate-500">{action.target_type}:{action.target_id}</div>
              </div>
              {action.command_status === "queued" ? (
                <button onClick={() => executeAction(action.id)} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white">
                  <Play className="h-4 w-4" /> Execute
                </button>
              ) : <ShieldCheck className="h-5 w-5 text-emerald-700" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
