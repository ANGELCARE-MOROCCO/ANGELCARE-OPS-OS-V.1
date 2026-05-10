"use client"

import { useEffect, useState } from "react"
import { Lock, Play, RefreshCw, UserPlus, Users } from "lucide-react"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  return res.json()
}

export default function TeamCollaborationPanel() {
  const [queues, setQueues] = useState<any[]>([])
  const [workloads, setWorkloads] = useState<any[]>([])
  const [locks, setLocks] = useState<any[]>([])
  const [presence, setPresence] = useState<any[]>([])
  const [threads, setThreads] = useState<any[]>([])
  const [selectedThread, setSelectedThread] = useState("")
  const [agentKey, setAgentKey] = useState("operations-agent")
  const [status, setStatus] = useState("Ready")

  async function load() {
    const [q, w, l, p, t] = await Promise.all([
      api("/api/email-os/collaboration/assignment-queues"),
      api("/api/email-os/collaboration/workloads"),
      api("/api/email-os/collaboration/thread-locks"),
      api("/api/email-os/collaboration/presence"),
      api("/api/email-os/entities/threads")
    ])

    setQueues(q.data || [])
    setWorkloads(w.data || [])
    setLocks(l.data || [])
    setPresence(p.data || [])
    setThreads(t.data || [])

    if (!selectedThread && (t.data || [])[0]) setSelectedThread(t.data[0].id)
  }

  async function createQueue() {
    const result = await api("/api/email-os/collaboration/assignment-queues", {
      method: "POST",
      body: JSON.stringify({ name: "Operations Assignment Queue", teamKey: "operations" })
    })
    setStatus(result.ok ? "Queue created" : result.error || "Failed")
    await load()
  }

  async function updatePresence() {
    const result = await api("/api/email-os/collaboration/presence", {
      method: "POST",
      body: JSON.stringify({ agentKey, teamKey: "operations", status: "online", currentThreadId: selectedThread || null })
    })
    setStatus(result.ok ? "Presence updated" : result.error || "Failed")
    await load()
  }

  async function updateWorkload() {
    const result = await api("/api/email-os/collaboration/workloads", {
      method: "POST",
      body: JSON.stringify({ agentKey, teamKey: "operations", activeThreads: 1, capacity: 20, status: "available" })
    })
    setStatus(result.ok ? "Workload updated" : result.error || "Failed")
    await load()
  }

  async function lockThread() {
    if (!selectedThread) return setStatus("Select a thread first")
    const result = await api("/api/email-os/collaboration/thread-locks", {
      method: "POST",
      body: JSON.stringify({ threadId: selectedThread, lockedBy: agentKey, lockReason: "active handling" })
    })
    setStatus(result.ok ? "Thread locked" : result.error || "Lock failed")
    await load()
  }

  async function transferThread() {
    if (!selectedThread) return setStatus("Select a thread first")
    const result = await api("/api/email-os/collaboration/transfer-ownership", {
      method: "POST",
      body: JSON.stringify({ threadId: selectedThread, owner: agentKey })
    })
    setStatus(result.ok ? "Ownership transferred" : result.error || "Transfer failed")
    await load()
  }

  useEffect(() => { load() }, [])

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Team Collaboration Operations</h2>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </div>

          <button onClick={load} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <input value={agentKey} onChange={(e) => setAgentKey(e.target.value)} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none" />
          <select value={selectedThread} onChange={(e) => setSelectedThread(e.target.value)} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm font-bold">
            <option value="">Select thread</option>
            {threads.map((thread) => <option key={thread.id} value={thread.id}>{thread.subject || thread.id}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            <button onClick={createQueue} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"><Play className="h-4 w-4" /> Queue</button>
            <button onClick={updatePresence} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"><Users className="h-4 w-4" /> Presence</button>
            <button onClick={updateWorkload} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50"><UserPlus className="h-4 w-4" /> Workload</button>
            <button onClick={lockThread} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-3 text-sm font-bold text-white"><Lock className="h-4 w-4" /> Lock</button>
            <button onClick={transferThread} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-indigo-700 px-3 text-sm font-bold text-white"><UserPlus className="h-4 w-4" /> Transfer</button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-black">{queues.length}</div><div className="text-xs font-black uppercase text-slate-400">Queues</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-black">{workloads.length}</div><div className="text-xs font-black uppercase text-slate-400">Workloads</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-black">{locks.length}</div><div className="text-xs font-black uppercase text-slate-400">Locks</div></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-black">{presence.length}</div><div className="text-xs font-black uppercase text-slate-400">Presence</div></div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Active Locks</h3>
          <div className="mt-4 space-y-3">
            {locks.length === 0 ? <div className="text-sm font-bold text-slate-500">No active locks.</div> : null}
            {locks.map((lock) => (
              <div key={lock.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-950">{lock.thread_id}</div>
                <div className="text-sm text-slate-500">Locked by {lock.locked_by}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Presence</h3>
          <div className="mt-4 space-y-3">
            {presence.length === 0 ? <div className="text-sm font-bold text-slate-500">No presence yet.</div> : null}
            {presence.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-950">{item.agent_key}</div>
                <div className="text-sm text-slate-500">{item.status} • {item.current_thread_id || "no thread"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
