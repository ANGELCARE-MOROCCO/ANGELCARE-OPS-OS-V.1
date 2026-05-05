"use client"

import { useMemo, useState } from "react"
import MarketActionButton from "@/components/market-os/market-action-button"

type RuleStatus = "active" | "paused" | "draft"
type RuleRisk = "critical" | "high" | "medium" | "low"
type RuleAction = "create_task" | "send_alert" | "escalate" | "request_approval" | "create_report"

type AutomationRule = {
  id: string
  title: string
  status: RuleStatus
  risk: RuleRisk
  action: RuleAction
  sourceEngine: string
  owner: string
  sla: string
  triggerCount: number
  lastTriggered: string
  triggerCondition: string
  generatedAction: string
  businessReason: string
}

const automationRules: AutomationRule[] = [
  {
    id: "auto-rule-001",
    title: "High-risk campaign blocker escalation",
    status: "active",
    risk: "critical",
    action: "escalate",
    sourceEngine: "Campaign Lifecycle",
    owner: "Marketing Lead",
    sla: "2h",
    triggerCount: 18,
    lastTriggered: "Today",
    triggerCondition: "Campaign task remains blocked while launch date is less than 48 hours away.",
    generatedAction: "Escalate to marketing lead and create recovery task.",
    businessReason: "Protects launch deadlines and prevents campaign execution delays.",
  },
  {
    id: "auto-rule-002",
    title: "SEO content missing owner",
    status: "active",
    risk: "high",
    action: "create_task",
    sourceEngine: "SEO Blog Workspace",
    owner: "Content Manager",
    sla: "24h",
    triggerCount: 9,
    lastTriggered: "Yesterday",
    triggerCondition: "SEO item has no owner or no next action after creation.",
    generatedAction: "Create task to assign owner and due date.",
    businessReason: "Prevents content from becoming invisible after intake.",
  },
  {
    id: "auto-rule-003",
    title: "Approval delay warning",
    status: "paused",
    risk: "medium",
    action: "send_alert",
    sourceEngine: "Approval Workflow",
    owner: "Ops Controller",
    sla: "1 day",
    triggerCount: 12,
    lastTriggered: "This week",
    triggerCondition: "Approval status remains pending beyond configured delay.",
    generatedAction: "Send alert to manager and requester.",
    businessReason: "Keeps operational decisions moving without blocking production.",
  },
  {
    id: "auto-rule-004",
    title: "Weekly content production report",
    status: "draft",
    risk: "low",
    action: "create_report",
    sourceEngine: "Content Command Center",
    owner: "Market OS",
    sla: "Weekly",
    triggerCount: 0,
    lastTriggered: "Never",
    triggerCondition: "Every Monday morning, summarize open, completed and blocked content tasks.",
    generatedAction: "Create weekly report and route to marketing leadership.",
    businessReason: "Improves visibility and rhythm for marketing operations.",
  },
  {
    id: "auto-rule-005",
    title: "Budget-sensitive content decision",
    status: "active",
    risk: "high",
    action: "request_approval",
    sourceEngine: "Growth Control Room",
    owner: "Growth Lead",
    sla: "4h",
    triggerCount: 5,
    lastTriggered: "Today",
    triggerCondition: "Growth action has budget impact above approved threshold.",
    generatedAction: "Request approval before execution.",
    businessReason: "Protects spending control while allowing fast growth execution.",
  },
]

function statusLabel(status: RuleStatus) {
  const labels: Record<RuleStatus, string> = {
    active: "Active",
    paused: "Paused",
    draft: "Draft",
  }
  return labels[status]
}

function actionLabel(action: RuleAction) {
  const labels: Record<RuleAction, string> = {
    create_task: "Create Task",
    send_alert: "Send Alert",
    escalate: "Escalate",
    request_approval: "Request Approval",
    create_report: "Create Report",
  }
  return labels[action]
}

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "draft") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "paused" || value === "request_approval") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "active" || value === "create_task") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

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
            Market-OS · Self-contained rules view
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Marketing Automation & Trigger Rules Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This component no longer imports the removed automation lib. It stays visible and operational with local rule presets while you decide whether to rebuild the backend engine later.
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