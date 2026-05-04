"use client"

import { useMemo, useState } from "react"
import {
  roleLabel,
  rolePermissions,
  statusLabel,
  type PermissionRisk,
  type PermissionStatus,
  type WorkspaceRole,
} from "@/lib/market-os/role-workspace-permissions-engine"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "restricted") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "review") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}
import MarketActionButton from "@/components/market-os/market-action-button"

export default function RoleWorkspacePermissionsEngine() {
  const [query, setQuery] = useState("")
  const [role, setRole] = useState<WorkspaceRole | "all">("all")
  const [status, setStatus] = useState<PermissionStatus | "all">("all")
  const [risk, setRisk] = useState<PermissionRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return rolePermissions.filter((item) => {
      const queryMatch =
        !q ||
        roleLabel(item.role).toLowerCase().includes(q) ||
        item.executionRights.toLowerCase().includes(q) ||
        item.restrictedAreas.toLowerCase().includes(q)

      return (
        queryMatch &&
        (role === "all" || item.role === role) &&
        (status === "all" || item.status === status) &&
        (risk === "all" || item.risk === risk)
      )
    })
  }, [query, role, status, risk])

  const fullAccess = rolePermissions.filter((r) => r.enginesAllowed >= 20).length
  const restricted = rolePermissions.filter((r) => r.status === "restricted").length
  const review = rolePermissions.filter((r) => r.status === "review").length
  const avgEngines = Math.round(rolePermissions.reduce((sum, r) => sum + r.enginesAllowed, 0) / rolePermissions.length)

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 25
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Permission & Role Workspace Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer protects Market-OS by controlling who can see, act, approve, escalate,
            export and access strategic or financial areas.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Full Access Roles</p>
              <p className="mt-2 text-3xl font-black">{fullAccess}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Restricted Roles</p>
              <p className="mt-2 text-3xl font-black">{restricted}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Need Review</p>
              <p className="mt-2 text-3xl font-black">{review}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Engines</p>
              <p className="mt-2 text-3xl font-black">{avgEngines}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search role, rights, restrictions..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All roles</option>
              <option value="ceo">CEO</option>
              <option value="marketing_director">Marketing Director</option>
              <option value="manager">Manager</option>
              <option value="agent">Agent</option>
              <option value="viewer">Viewer</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as PermissionStatus | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="review">Review</option>
              <option value="restricted">Restricted</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as PermissionRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
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
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                  Role: {roleLabel(item.role)}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.status)}`}>
                  {statusLabel(item.status)}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(item.risk)}`}>
                  Risk: {item.risk}
                </span>
              </div>

              <h2 className="text-xl font-black">{roleLabel(item.role)} Workspace Rights</h2>
              <p className="mt-1 text-sm text-slate-500">Allowed engines: {item.enginesAllowed}</p>

              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Approval Power</p>
                  <p className="mt-2 text-sm text-slate-700">{item.approvalPower}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Financial Visibility</p>
                  <p className="mt-2 text-sm text-slate-700">{item.financialVisibility}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Execution Rights</p>
                  <p className="mt-2 text-sm text-slate-700">{item.executionRights}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Restricted Areas</p>
                  <p className="mt-2 text-sm text-slate-700">{item.restrictedAreas}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Reason</p>
                  <p className="mt-2 text-sm text-slate-700">{item.reason}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                  <p className="mt-2 text-sm text-slate-700">{item.nextAction}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="permissions" engine="system" actionKey="execute_apply_role_rules" actionLabel="Apply Role Rules" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Apply Role Rules</MarketActionButton>
                <MarketActionButton moduleKey="permissions" engine="system" actionKey="execute_edit_permissions" actionLabel="Edit Permissions" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Edit Permissions</MarketActionButton>
                <MarketActionButton moduleKey="permissions" engine="system" actionKey="review_access" actionLabel="Review Access" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Review Access</MarketActionButton>
                <MarketActionButton moduleKey="permissions" engine="system" actionKey="open_audit" actionLabel="Open Audit" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Open Audit</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
