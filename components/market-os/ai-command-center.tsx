"use client"

import { useState } from "react"

type Command = {
  id: string
  title: string
  priority: "P0" | "P1" | "P2"
  owner: string
  diagnosis: string
  command: string
  expectedImpact: string
}

const commands: Command[] = [
  {
    id: "cmd-001",
    title: "FIX HIGH-INTENT LEAD LOSS",
    priority: "P0",
    owner: "Sales Manager",
    diagnosis: "High-intent leads require faster operational response and tighter escalation.",
    command: "Assign owner, create task chain, and monitor within the same operating day.",
    expectedImpact: "+15–25% conversion protection",
  },
  {
    id: "cmd-002",
    title: "LAUNCH PREMIUM POSTPARTUM CAMPAIGN",
    priority: "P0",
    owner: "Marketing Director",
    diagnosis: "Campaign needs approval, launch checklist and monitored execution.",
    command: "Create execution task chain and run with daily follow-up.",
    expectedImpact: "+150k–300k MAD pipeline potential",
  },
  {
    id: "cmd-003",
    title: "FIX ATTRIBUTION GAP",
    priority: "P1",
    owner: "Marketing Ops",
    diagnosis: "WhatsApp and campaign source capture are incomplete.",
    command: "Create attribution repair task chain and enforce source capture.",
    expectedImpact: "Cleaner CAC and better scaling decisions",
  },
]

function badgeClass(value: string) {
  if (value === "P0") return "border-red-200 bg-red-50 text-red-700"
  if (value === "P1") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function AiCommandCenter() {
  const [message, setMessage] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function logAction(command: Command, actionKey: string, actionLabel: string) {
    await fetch("/api/market-os/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_module: "AI Command Center",
        action_key: actionKey,
        action_label: actionLabel,
        target_type: "ai_command",
        target_id: command.id,
        target_title: command.title,
        payload: command,
        created_by_name: "Market-OS User",
      }),
    })
  }

  async function createTaskChain(command: Command) {
    setLoadingId(command.id)
    setMessage("")

    await fetch("/api/market-os/task-chains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Command Chain: ${command.title}`,
        linked_objective: command.title,
        owner_name: command.owner,
        status: "draft",
        progress: 0,
        ai_generated: true,
        step_1: command.diagnosis,
        step_2: command.command,
        step_3: "Execute and update progress.",
        step_4: "Close outcome and log result.",
      }),
    })

    await logAction(command, "create_task_chain", "Create Task Chain")
    setMessage(`Task chain created for: ${command.title}`)
    setLoadingId(null)
  }

  async function executeCommand(command: Command) {
    setLoadingId(command.id)
    setMessage("")
    await logAction(command, "execute_command", "Execute Command")
    setMessage(`Execution logged for: ${command.title}`)
    setLoadingId(null)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Market-OS · Activation Pack 02</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">AI Command Center</h1>
          <p className="mt-4 max-w-3xl text-slate-300">Executable AI command layer: log execution and create real task chains.</p>
        </div>

        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div>}

        <div className="grid gap-5">
          {commands.map((command) => (
            <article key={command.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(command.priority)}`}>{command.priority}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold">Owner: {command.owner}</span>
              </div>
              <h2 className="text-xl font-black">{command.title}</h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase text-slate-500">Diagnosis</p><p className="mt-2 text-sm">{command.diagnosis}</p></div>
                <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase text-slate-500">Command</p><p className="mt-2 text-sm font-semibold">{command.command}</p></div>
                <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase text-slate-500">Impact</p><p className="mt-2 text-sm">{command.expectedImpact}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => executeCommand(command)} disabled={loadingId === command.id} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Execute</button>
                <button onClick={() => createTaskChain(command)} disabled={loadingId === command.id} className="rounded-2xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 disabled:opacity-50">Create Task Chain</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
