"use client"

import { useEffect, useMemo, useState } from "react"

type Chain = {
  id: string
  title: string | null
  linked_objective: string | null
  owner_name: string | null
  status: string | null
  progress: number | null
  step_1?: string | null
  step_2?: string | null
  step_3?: string | null
  step_4?: string | null
}

function badgeClass(value: string | null) {
  if (value === "blocked") return "border-red-200 bg-red-50 text-red-700"
  if (value === "running" || value === "draft") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function AiTaskChainOrchestrator() {
  const [chains, setChains] = useState<Chain[]>([])
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", linked_objective: "", owner_name: "" })

  async function load() {
    setError("")
    const res = await fetch("/api/market-os/task-chains")
    const json = await res.json()
    if (!res.ok) setError(json.error || "Failed to load task chains")
    else setChains(json.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function logAction(chain: Chain, actionKey: string, actionLabel: string) {
    await fetch("/api/market-os/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_module: "AI Task Chain Orchestrator",
        action_key: actionKey,
        action_label: actionLabel,
        target_type: "task_chain",
        target_id: chain.id,
        target_title: chain.title,
        payload: chain,
        created_by_name: "Market-OS User",
      }),
    })
  }

  async function createChain() {
    if (!form.title.trim()) return setError("Title is required")
    setError("")
    setMessage("")

    const res = await fetch("/api/market-os/task-chains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        status: "draft",
        progress: 0,
        ai_generated: false,
        step_1: "Clarify execution output.",
        step_2: "Assign accountable owner.",
        step_3: "Execute and update progress.",
        step_4: "Close outcome.",
      }),
    })

    const json = await res.json()
    if (!res.ok) setError(json.error || "Failed to create chain")
    else {
      setMessage("Task chain created")
      setForm({ title: "", linked_objective: "", owner_name: "" })
      await load()
    }
  }

  async function updateChain(chain: Chain, patch: Partial<Chain>, label: string) {
    setLoadingId(chain.id)
    setError("")
    setMessage("")

    const res = await fetch("/api/market-os/task-chains", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...chain, ...patch }),
    })

    const json = await res.json()
    if (!res.ok) setError(json.error || "Failed to update chain")
    else {
      await logAction({ ...chain, ...patch }, label.toLowerCase().replaceAll(" ", "_"), label)
      setMessage(`${label}: ${chain.title}`)
      await load()
    }

    setLoadingId(null)
  }

  async function deleteChain(chain: Chain) {
    setLoadingId(chain.id)
    setError("")
    setMessage("")

    const res = await fetch(`/api/market-os/task-chains?id=${chain.id}`, { method: "DELETE" })
    const json = await res.json()
    if (!res.ok) setError(json.error || "Failed to delete chain")
    else {
      await logAction(chain, "delete_chain", "Delete Chain")
      setMessage(`Deleted: ${chain.title}`)
      await load()
    }

    setLoadingId(null)
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return chains.filter((c) => !q || c.title?.toLowerCase().includes(q) || c.owner_name?.toLowerCase().includes(q) || c.linked_objective?.toLowerCase().includes(q))
  }, [chains, query])

  const running = chains.filter((c) => c.status === "running").length
  const completed = chains.filter((c) => c.status === "completed").length
  const blocked = chains.filter((c) => c.status === "blocked").length
  const avgProgress = chains.length ? Math.round(chains.reduce((sum, c) => sum + Number(c.progress || 0), 0) / chains.length) : 0

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Market-OS · Activation Pack 02</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">AI Task Chain Orchestrator</h1>
          <p className="mt-4 max-w-3xl text-slate-300">Executable task-chain control: create, start, progress, block, complete and delete chains.</p>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Running</p><p className="mt-2 text-3xl font-black">{running}</p></div>
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Completed</p><p className="mt-2 text-3xl font-black">{completed}</p></div>
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Blocked</p><p className="mt-2 text-3xl font-black">{blocked}</p></div>
            <div className="rounded-3xl bg-white/10 p-4"><p className="text-xs uppercase text-slate-300">Avg Progress</p><p className="mt-2 text-3xl font-black">{avgProgress}%</p></div>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Create Task Chain</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Chain title" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <input value={form.linked_objective} onChange={(e) => setForm({ ...form, linked_objective: e.target.value })} placeholder="Linked objective" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="Owner" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <button onClick={createChain} className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Create Chain</button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chains..." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" /></div>

        <div className="grid gap-5">
          {filtered.map((chain) => (
            <article key={chain.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(chain.status)}`}>{chain.status || "draft"}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold">Owner: {chain.owner_name || "Unassigned"}</span></div>
              <h2 className="text-xl font-black">{chain.title}</h2>
              <p className="mt-1 text-sm text-slate-500">Linked: {chain.linked_objective || "—"}</p>
              <div className="mt-5 rounded-2xl border border-slate-200 p-4"><div className="mb-2 flex justify-between text-sm"><span className="font-bold">Progress</span><span>{Number(chain.progress || 0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-950" style={{ width: `${Number(chain.progress || 0)}%` }} /></div></div>
              <div className="mt-5 grid gap-2 md:grid-cols-4">{[chain.step_1, chain.step_2, chain.step_3, chain.step_4].map((step, i) => <div key={i} className="rounded-2xl border border-slate-200 p-3 text-sm"><p className="text-xs font-bold uppercase text-slate-500">Step {i + 1}</p><p className="mt-1">{step || "Not defined"}</p></div>)}</div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => updateChain(chain, { status: "running", progress: Math.max(Number(chain.progress || 0), 10) }, "Start Chain")} disabled={loadingId === chain.id} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Start Chain</button>
                <button onClick={() => updateChain(chain, { progress: Math.min(100, Number(chain.progress || 0) + 25), status: Number(chain.progress || 0) + 25 >= 100 ? "completed" : "running" }, "Advance Progress")} disabled={loadingId === chain.id} className="rounded-2xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 disabled:opacity-50">+25%</button>
                <button onClick={() => updateChain(chain, { status: "blocked" }, "Clear/Flag Blocker")} disabled={loadingId === chain.id} className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50">Flag Blocker</button>
                <button onClick={() => updateChain(chain, { status: "completed", progress: 100 }, "Complete Chain")} disabled={loadingId === chain.id} className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700 disabled:opacity-50">Complete</button>
                <button onClick={() => deleteChain(chain)} disabled={loadingId === chain.id} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-50">Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
