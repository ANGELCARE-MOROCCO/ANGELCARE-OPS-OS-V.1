export default function Page() {
  const checks = [
    ["email-reliability", "IMAP checkpointing active"],
    ["email-reliability", "SMTP retry policy configured"],
    ["email-reliability", "Provider failover events available"],
    ["realtime", "Realtime channels configured"],
    ["realtime", "Live event publish route active"],
    ["ai", "AI memory initialized"],
    ["ai", "AI workflow plan route active"],
    ["security", "RBAC seed applied"],
    ["security", "Security audit events generated"],
    ["ux", "Empty states and loading shells available"]
  ]

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Email-OS Product Maturity Checklist</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Use this checklist before calling Email-OS enterprise-ready.</p>
        <div className="mt-6 grid gap-3">
          {checks.map(([area, label]) => (
            <label key={`${area}-${label}`} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input type="checkbox" className="h-4 w-4 cursor-pointer" />
              <span className="text-sm font-black text-slate-500 uppercase">{area}</span>
              <span className="text-sm font-bold text-slate-800">{label}</span>
            </label>
          ))}
        </div>
      </section>
    </main>
  )
}
