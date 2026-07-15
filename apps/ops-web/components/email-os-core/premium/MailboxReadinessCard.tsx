"use client"

import { CheckCircle2, CircleAlert } from "lucide-react"

export default function MailboxReadinessCard({ setup }: { setup: any }) {
  const checks = [
    ["Mailbox name", Boolean(setup.name)],
    ["Email address", Boolean(setup.emailAddress && setup.emailAddress.includes("@"))],
    ["Provider profile", Boolean(setup.providerProfileId)],
    ["Username", Boolean(setup.username || setup.emailAddress)],
    ["Password reference", Boolean(setup.passwordRef)],
    ["Owner", Boolean(setup.owner)],
    ["Permission scope", Boolean(setup.permissionScope)]
  ]

  const ready = checks.filter(([, ok]) => ok).length
  const percent = Math.round((ready / checks.length) * 100)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-950">Mailbox Readiness</h3>
          <p className="mt-1 text-sm text-slate-500">Complete the required setup before activating this mailbox.</p>
        </div>
        <div className="text-3xl font-black text-slate-950">{percent}%</div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-950" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-5 space-y-3">
        {checks.map(([label, ok]) => (
          <div key={String(label)} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-bold text-slate-700">{label}</div>
            {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <CircleAlert className="h-5 w-5 text-amber-600" />}
          </div>
        ))}
      </div>
    </section>
  )
}
