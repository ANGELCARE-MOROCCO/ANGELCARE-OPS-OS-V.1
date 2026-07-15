export default function Page() {
  const sections = [
    ["Core", ["Mailbox CRUD", "Templates CRUD", "Threads split pane", "Drafts", "Outbox queue", "Audit logs"]],
    ["Providers", ["Health API", "SMTP send or queue", "IMAP sync", "Queue retry", "Provider readiness"]],
    ["Enterprise", ["Approvals", "SLA rules", "Assignments", "Internal notes", "Analytics", "Diagnostics"]],
    ["Production", ["Build passes", "Smoke test passes", "Legacy scan clean", "Vercel env checked", "SQL applied"]]
  ]

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Email-OS Final Acceptance</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use this before committing and deploying the clean Email-OS core.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {sections.map(([title, items]) => (
            <div key={title as string} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-black text-slate-950">{title}</h2>
              <div className="mt-4 space-y-3">
                {(items as string[]).map((item) => (
                  <label key={item} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3">
                    <input type="checkbox" className="h-4 w-4 cursor-pointer" />
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
