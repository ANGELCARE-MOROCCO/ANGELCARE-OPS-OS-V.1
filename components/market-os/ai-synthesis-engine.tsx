"use client"

import { useState } from "react"

type Synthesis = {
  id: string
  title: string
  priority: "P0" | "P1" | "P2"
  owner: string
  diagnosis: string
  command: string
  successMetric: string
  impactMad: number
}

const syntheses: Synthesis[] = [
  {
    id: "syn-001",
    title: "Protect Premium Postpartum Revenue Window",
    priority: "P0",
    owner: "Marketing Director",
    diagnosis: "Revenue window is strong but launch control and trust proof must be enforced.",
    command: "Create task chain, assign owner, and monitor CAC/outcome.",
    successMetric: "CAC under target and qualified conversion above threshold.",
    impactMad: 280000,
  },
  {
    id: "syn-002",
    title: "Fix Attribution Before Scaling Paid Campaigns",
    priority: "P1",
    owner: "Marketing Ops",
    diagnosis: "Source capture is incomplete and scaling decisions are exposed.",
    command: "Create attribution repair task chain and audit source capture.",
    successMetric: "Attribution confidence above 85%.",
    impactMad: 137000,
  },
]

function formatMad(value: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(value)
}

function badgeClass(value: string) {
  if (value === "P0") return "border-red-200 bg-red-50 text-red-700"
  if (value === "P1") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function AiSynthesisEngine() {
  const [message, setMessage] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function logAction(item: Synthesis, actionKey: string, actionLabel: string) {
    await fetch("/api/market-os/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_module: "AI Synthesis Engine",
        action_key: actionKey,
        action_label: actionLabel,
        target_type: "ai_synthesis",
        target_id: item.id,
        target_title: item.title,
        payload: item,
        created_by_name: "Market-OS User",
      }),
    })
  }

  async function createTaskChain(item: Synthesis) {
    setLoadingId(item.id)
    setMessage("")

    await fetch("/api/market-os/task-chains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Synthesis Chain: ${item.title}`,
        linked_objective: item.title,
        owner_name: item.owner,
        status: "draft",
        progress: 0,
        ai_generated: true,
        step_1: item.diagnosis,
        step_2: item.command,
        step_3: item.successMetric,
        step_4: "Close and convert learning into playbook.",
      }),
    })

    await logAction(item, "create_synthesis_chain", "Create Task Chain")
    setMessage(`Task chain created for: ${item.title}`)
    setLoadingId(null)
  }

  async function sendToBoard(item: Synthesis) {
    setLoadingId(item.id)
    setMessage("")
    await logAction(item, "send_to_board", "Send to CEO Board")
    setMessage(`Board action logged for: ${item.title}`)
    setLoadingId(null)
  }

  async function monitorOutcome(item: Synthesis) {
    setLoadingId(item.id)
    setMessage("")
    await logAction(item, "monitor_outcome", "Monitor Outcome")
    setMessage(`Outcome monitoring logged for: ${item.title}`)
    setLoadingId(null)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Market-OS · Activation Pack 02</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">AI Synthesis Engine</h1>
          <p className="mt-4 max-w-3xl text-slate-300">Executable synthesis layer: convert synthesis into task chains, board actions and outcome monitoring.</p>
        </div>

        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="grid gap-5">
          {syntheses.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.priority)}`}>{item.priority}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold">{item.owner}</span></div>
                  <h2 className="text-xl font-black">{item.title}</h2>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-right"><p className="text-xs font-bold uppercase text-slate-500">Impact</p><p className="font-black">{formatMad(item.impactMad)}</p></div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase text-slate-500">Diagnosis</p><p className="mt-2 text-sm">{item.diagnosis}</p></div>
                <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase text-slate-500">Command</p><p className="mt-2 text-sm font-semibold">{item.command}</p></div>
                <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase text-slate-500">Success Metric</p><p className="mt-2 text-sm">{item.successMetric}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => createTaskChain(item)} disabled={loadingId === item.id} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Create Task Chain</button>
                <button onClick={() => sendToBoard(item)} disabled={loadingId === item.id} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-50">Send to Board</button>
                <button onClick={() => monitorOutcome(item)} disabled={loadingId === item.id} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-50">Monitor Outcome</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
