"use client"

import { useEffect, useState } from "react"
import { Play, Plus, RefreshCw, RotateCw } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function SyncOperationsPanel() {
  const [mailboxes, setMailboxes] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [selectedMailbox, setSelectedMailbox] = useState("")
  const [status, setStatus] = useState("Ready")

  async function load() {
    const [m, s, j, h] = await Promise.all([
      api("/api/email-os/entities/mailboxes"),
      api("/api/email-os/sync-schedules"),
      api("/api/email-os/sync-jobs"),
      api("/api/email-os/sync-history")
    ])
    setMailboxes(m.data || [])
    setSchedules(s.data || [])
    setJobs(j.data || [])
    setHistory(h.data || [])
    if (!selectedMailbox && (m.data || [])[0]) setSelectedMailbox(m.data[0].id)
  }

  async function createSchedule() {
    if (!selectedMailbox) return setStatus("Select mailbox first")
    const result = await api("/api/email-os/sync-schedules", {
      method: "POST",
      body: JSON.stringify({ mailboxId: selectedMailbox, scheduleName: "15 min sync", frequencyMinutes: 15 })
    })
    setStatus(result.ok ? "Schedule created" : result.error || "Failed")
    await load()
  }

  async function enqueueJob() {
    if (!selectedMailbox) return setStatus("Select mailbox first")
    const result = await api("/api/email-os/sync-jobs", {
      method: "POST",
      body: JSON.stringify({ mailboxId: selectedMailbox })
    })
    setStatus(result.ok ? "Sync job queued" : result.error || "Failed")
    await load()
  }

  async function runJob(id: string) {
    const result = await api(`/api/email-os/sync-jobs/${id}/run`, { method: "POST" })
    setStatus(result.ok ? "Sync job completed" : result.error || "Sync failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <RotateCw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Mailbox Sync Operations</h2>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select value={selectedMailbox} onChange={(e) => setSelectedMailbox(e.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold">
              <option value="">Select mailbox</option>
              {mailboxes.map((mailbox) => <option key={mailbox.id} value={mailbox.id}>{mailbox.name || mailbox.address}</option>)}
            </select>
            <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
            <button onClick={createSchedule} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"><Plus className="h-4 w-4" /> Schedule</button>
            <button onClick={enqueueJob} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Queue sync</button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-black">{schedules.length}</div><div className="text-xs font-black uppercase text-slate-400">Schedules</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-black">{jobs.length}</div><div className="text-xs font-black uppercase text-slate-400">Jobs</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-black">{history.length}</div><div className="text-xs font-black uppercase text-slate-400">History</div></div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Queued Sync Jobs</h3>
          <div className="mt-4 space-y-3">
            {jobs.length === 0 ? <div className="text-sm font-bold text-slate-500">No jobs yet.</div> : null}
            {jobs.slice(0, 20).map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div><div className="font-black text-slate-950">{job.status}</div><div className="text-sm text-slate-500">{job.mailbox_id}</div></div>
                {job.status === "queued" ? <button onClick={() => runJob(job.id)} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-bold text-white"><Play className="h-4 w-4" /> Run</button> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Sync History</h3>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? <div className="text-sm font-bold text-slate-500">No history yet.</div> : null}
            {history.slice(0, 20).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-950">{item.status} • {item.messages_synced} messages</div>
                <div className="text-sm text-slate-500">{item.created_at}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
