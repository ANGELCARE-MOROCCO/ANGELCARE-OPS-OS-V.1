"use client"

import { useMemo, useState } from "react"
import {
  approvalLabel,
  controlItems,
  escalationLabel,
  slaLabel,
  type ApprovalStatus,
  type EscalationLevel,
  type SlaState,
} from "@/lib/market-os/approval-sla-escalation-engine"

function badgeClass(value: string) {
  if (
    value === "breached" ||
    value === "late" ||
    value === "critical" ||
    value === "ceo" ||
    value === "rejected"
  ) {
    return "border-red-200 bg-red-50 text-red-700"
  }

  if (
    value === "warning" ||
    value === "manager" ||
    value === "pending" ||
    value === "needs_revision"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }

  if (value === "approved" || value === "validated" || value === "on_time" || value === "none") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }

  return "border-slate-200 bg-slate-50 text-slate-700"
}
import MarketActionButton from "@/app/components/market-os/market-action-button"

export default function ApprovalSlaEscalationEngine() {
  const [query, setQuery] = useState("")
  const [slaFilter, setSlaFilter] = useState<SlaState | "all">("all")
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus | "all">("all")
  const [escalationFilter, setEscalationFilter] = useState<EscalationLevel | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return controlItems.filter((item) => {
      const queryMatch =
        !q ||
        item.relatedTask.toLowerCase().includes(q) ||
        item.objective.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q)

      const slaMatch = slaFilter === "all" || item.slaState === slaFilter
      const approvalMatch = approvalFilter === "all" || item.approvalStatus === approvalFilter
      const escalationMatch = escalationFilter === "all" || item.escalationLevel === escalationFilter

      return queryMatch && slaMatch && approvalMatch && escalationMatch
    })
  }, [query, slaFilter, approvalFilter, escalationFilter])

  const pendingApprovals = controlItems.filter((i) => i.approvalStatus === "pending").length
  const lateItems = controlItems.filter((i) => i.slaState === "late" || i.slaState === "breached").length
  const escalatedItems = controlItems.filter((i) => i.escalationLevel !== "none").length
  const missingProof = controlItems.filter((i) => i.proofStatus === "missing").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 3
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Approval, SLA & Escalation Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This control layer prevents Market-OS work from staying informal. Every strategic task
            can require proof, approval, SLA discipline and escalation when execution becomes risky.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Pending Approvals</p>
              <p className="mt-2 text-3xl font-black">{pendingApprovals}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Late / Breached</p>
              <p className="mt-2 text-3xl font-black">{lateItems}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Escalated</p>
              <p className="mt-2 text-3xl font-black">{escalatedItems}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Missing Proof</p>
              <p className="mt-2 text-3xl font-black">{missingProof}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search task, objective, owner..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 md:col-span-1"
            />

            <select
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value as SlaState | "all")}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
            >
              <option value="all">All SLA states</option>
              <option value="on_time">On Time</option>
              <option value="warning">Warning</option>
              <option value="late">Late</option>
              <option value="breached">Breached</option>
            </select>

            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value as ApprovalStatus | "all")}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
            >
              <option value="all">All approvals</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="needs_revision">Needs Revision</option>
            </select>

            <select
              value={escalationFilter}
              onChange={(e) => setEscalationFilter(e.target.value as EscalationLevel | "all")}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
            >
              <option value="all">All escalation levels</option>
              <option value="none">No Escalation</option>
              <option value="manager">Manager</option>
              <option value="ceo">CEO</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.approvalStatus)}`}>
                      Approval: {approvalLabel(item.approvalStatus)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.slaState)}`}>
                      SLA: {slaLabel(item.slaState)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.escalationLevel)}`}>
                      Escalation: {escalationLabel(item.escalationLevel)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.proofStatus)}`}>
                      Proof: {item.proofStatus}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{item.relatedTask}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Objective: {item.objective} · Owner: {item.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Deadline</p>
                  <p className="mt-1 font-black">{item.deadline}</p>
                  <p className="text-xs text-slate-500">
                    {item.hoursRemaining >= 0 ? `${item.hoursRemaining}h remaining` : `${Math.abs(item.hoursRemaining)}h late`}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Manager Decision</p>
                  <p className="mt-2 text-sm text-slate-700">{item.managerDecision}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Required Action</p>
                  <p className="mt-2 text-sm text-slate-700">{item.requiredAction}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Business Risk</p>
                  <p className="mt-2 text-sm text-slate-700">{item.businessRisk}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="approval" engine="content" actionKey="approve" actionLabel="Approve" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Approve</MarketActionButton>
                <MarketActionButton moduleKey="approval" engine="content" actionKey="request_revision" actionLabel="Request Revision" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Request Revision</MarketActionButton>
                <MarketActionButton moduleKey="approval" engine="content" actionKey="validate_proof" actionLabel="Validate Proof" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Validate Proof</MarketActionButton>
                <MarketActionButton moduleKey="approval" engine="content" actionKey="escalate_now" actionLabel="Escalate Now" className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Escalate Now</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
