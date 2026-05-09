
import { defaultEmailApprovalPolicies } from "@/lib/email-os/enterprise/approval-engine"
import { defaultEmailSlaRules } from "@/lib/email-os/enterprise/sla-engine"
import { emailOSRolePermissions } from "@/lib/email-os/enterprise/rbac"

export default function EmailOSAdminGovernanceCenter() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border bg-white p-6">
          <h1 className="text-2xl font-bold">Email-OS Admin Governance Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure policies, SLA, role permissions, approval rules and operational controls.
          </p>
        </div>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Approval Policies</h2>
            <div className="mt-4 space-y-3">
              {defaultEmailApprovalPolicies.map((policy) => (
                <div key={policy.id} className="rounded-2xl border p-3">
                  <div className="font-medium">{policy.name}</div>
                  <div className="text-xs text-slate-500">{policy.approverRoles.join(", ")}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5">
            <h2 className="text-lg font-semibold">SLA Rules</h2>
            <div className="mt-4 space-y-3">
              {defaultEmailSlaRules.map((rule) => (
                <div key={rule.id} className="rounded-2xl border p-3">
                  <div className="font-medium">{rule.name}</div>
                  <div className="text-xs text-slate-500">{rule.responseMinutes} minutes • {rule.priority}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5">
            <h2 className="text-lg font-semibold">RBAC Matrix</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(emailOSRolePermissions).map(([role, permissions]) => (
                <div key={role} className="rounded-2xl border p-3">
                  <div className="font-medium">{role}</div>
                  <div className="text-xs text-slate-500">{permissions.length} permissions</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
