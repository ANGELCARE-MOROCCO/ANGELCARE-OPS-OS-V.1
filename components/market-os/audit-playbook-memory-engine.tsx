"use client"

import { useMemo, useState } from "react"
import {
  formatMad,
  memoryItems,
  statusLabel,
  typeLabel,
  type MemoryRisk,
  type MemoryStatus,
  type MemoryType,
} from "@/lib/market-os/audit-playbook-memory-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "mistake" || value === "new") {
    return "border-red-200 bg-red-50 text-red-700"
  }
  if (value === "medium" || value === "decision" || value === "validated") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  if (value === "low" || value === "success" || value === "converted" || value === "playbook") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}
import MarketActionButton from "@/components/market-os/market-action-button"

export default function AuditPlaybookMemoryEngine() {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<MemoryType | "all">("all")
  const [status, setStatus] = useState<MemoryStatus | "all">("all")
  const [risk, setRisk] = useState<MemoryRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return memoryItems.filter((item) => {
      const queryMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.sourceModule.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.reusablePlaybook.toLowerCase().includes(q)

      return (
        queryMatch &&
        (type === "all" || item.type === type) &&
        (status === "all" || item.status === status) &&
        (risk === "all" || item.risk === risk)
      )
    })
  }, [query, type, status, risk])

  const totalImpact = memoryItems.reduce((sum, item) => sum + item.businessImpactMad, 0)
  const playbooks = memoryItems.filter((item) => item.reusablePlaybook).length
  const highRisk = memoryItems.filter((item) => item.risk === "high" || item.risk === "critical").length
  const converted = memoryItems.filter((item) => item.status === "converted").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 16
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Audit, Playbook & Learning Memory Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer prevents Market-OS from forgetting. Every decision, mistake, success,
            audit event and lesson can become a reusable playbook for future execution.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Business Impact Logged</p>
              <p className="mt-2 text-2xl font-black">{formatMad(totalImpact)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Reusable Playbooks</p>
              <p className="mt-2 text-3xl font-black">{playbooks}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High-Risk Lessons</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Converted Knowledge</p>
              <p className="mt-2 text-3xl font-black">{converted}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search memory, source, owner, playbook..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={type} onChange={(e) => setType(e.target.value as MemoryType | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All types</option>
              <option value="decision">Decision</option>
              <option value="mistake">Mistake</option>
              <option value="success">Success</option>
              <option value="playbook">Playbook</option>
              <option value="audit">Audit</option>
              <option value="lesson">Lesson</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as MemoryStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="validated">Validated</option>
              <option value="converted">Converted</option>
              <option value="archived">Archived</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as MemoryRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.type)}`}>
                      Type: {typeLabel(item.type)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.risk)}`}>
                      Risk: {item.risk}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Source: {item.sourceModule} · Owner: {item.owner} · Date: {item.createdAt}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Impact</p>
                  <p className="mt-1 font-black">{formatMad(item.businessImpactMad)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Lesson</p>
                  <p className="mt-2 text-sm text-slate-700">{item.lesson}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Rule to Remember</p>
                  <p className="mt-2 text-sm text-slate-700">{item.ruleToRemember}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Reusable Playbook</p>
                  <p className="mt-2 text-sm text-slate-700">{item.reusablePlaybook}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{item.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="audit" engine="system" actionKey="convert_to_playbook" actionLabel="Convert to Playbook" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Convert to Playbook</MarketActionButton>
                <MarketActionButton moduleKey="audit" engine="system" actionKey="validate_lesson" actionLabel="Validate Lesson" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Validate Lesson</MarketActionButton>
                <MarketActionButton moduleKey="audit" engine="system" actionKey="create_rule" actionLabel="Create Rule" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Create Rule</MarketActionButton>
                <MarketActionButton moduleKey="audit" engine="system" actionKey="archive" actionLabel="Archive" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Archive</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
