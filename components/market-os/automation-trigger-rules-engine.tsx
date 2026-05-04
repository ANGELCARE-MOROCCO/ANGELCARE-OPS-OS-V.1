"use client"

import { useMemo, useState } from "react"
import {
  actionLabel,
  automationRules,
  statusLabel,
  type RuleAction,
  type RuleRisk,
  type RuleStatus,
} from "@/lib/market-os/automation-trigger-rules-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "draft") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "paused" || value === "request_approval") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "active" || value === "create_task") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}
import MarketActionButton from "@/components/market-os/market-action-button"

export default function AutomationTriggerRulesEngine() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<RuleStatus | "all">("all")
  const [risk, setRisk] = useState<RuleRisk | "all">("all")
  const [action, setAction] = useState<RuleAction | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return automationRules.filter((rule) => {
      const queryMatch =
        !q ||
        rule.title.toLowerCase().includes(q) ||
        rule.sourceEngine.toLowerCase().includes(q) ||
        rule.owner.toLowerCase().includes(q)

      return (
        queryMatch &&
        (status === "all" || rule.status === status) &&
        (risk === "all" || rule.risk === risk) &&
        (action === "all" || rule.action === action)
      )
    })
  }, [query, status, risk, action])

  const activeRules = automationRules.filter((r) => r.status === "active").length
  const totalTriggers = automationRules.reduce((sum, r) => sum + r.triggerCount, 0)
  const highRisk = automationRules.filter((r) => r.risk === "high" || r.risk === "critical").length
  const draftRules = automationRules.filter((r) => r.status === "draft").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 23
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Marketing Automation & Trigger Rules Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer makes Market-OS proactive: when signals, risks, SLA issues, campaign blockers
            or workload problems appear, the system creates tasks, alerts, approvals or escalations.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Active Rules</p>
              <p className="mt-2 text-3xl font-black">{activeRules}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Total Triggers</p>
              <p className="mt-2 text-3xl font-black">{totalTriggers}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk Rules</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Draft Rules</p>
              <p className="mt-2 text-3xl font-black">{draftRules}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rule, source, owner..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={status} onChange={(e) => setStatus(e.target.value as RuleStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as RuleRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select value={action} onChange={(e) => setAction(e.target.value as RuleAction | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All actions</option>
              <option value="create_task">Create Task</option>
              <option value="send_alert">Send Alert</option>
              <option value="escalate">Escalate</option>
              <option value="request_approval">Request Approval</option>
              <option value="create_report">Create Report</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((rule) => (
            <article key={rule.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(rule.status)}`}>
                      {statusLabel(rule.status)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(rule.risk)}`}>
                      Risk: {rule.risk}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(rule.action)}`}>
                      Action: {actionLabel(rule.action)}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{rule.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Source: {rule.sourceEngine} · Owner: {rule.owner} · SLA: {rule.sla}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Triggered</p>
                  <p className="mt-1 font-black">{rule.triggerCount} times</p>
                  <p className="text-xs text-slate-500">Last: {rule.lastTriggered}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Trigger Condition</p>
                  <p className="mt-2 text-sm text-slate-700">{rule.triggerCondition}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Generated Action</p>
                  <p className="mt-2 text-sm text-slate-700">{rule.generatedAction}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 lg:col-span-2">
                  <p className="text-xs font-bold uppercase text-slate-500">Business Reason</p>
                  <p className="mt-2 text-sm text-slate-700">{rule.businessReason}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="automation" engine="data" actionKey="activate_rule" actionLabel="Activate Rule" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Activate Rule</MarketActionButton>
                <MarketActionButton moduleKey="automation" engine="data" actionKey="test_trigger" actionLabel="Test Trigger" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Test Trigger</MarketActionButton>
                <MarketActionButton moduleKey="automation" engine="data" actionKey="pause_rule" actionLabel="Pause Rule" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Pause Rule</MarketActionButton>
                <MarketActionButton moduleKey="automation" engine="data" actionKey="log_view_trigger_log" actionLabel="View Trigger Log" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">View Trigger Log</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
