export default function Page() {
  const areas = [
    ["Email Reliability", ["SMTP retry policy exists", "IMAP checkpoint route exists", "Spam evaluation route exists", "Threading repair route exists"]],
    ["Realtime", ["Poll route exists", "Ack route exists", "Live widget installed", "Event publish route exists"]],
    ["AI", ["AI status route exists", "Draft suggestion guard exists", "Memory search exists", "OpenAI key optional but checked"]],
    ["Security", ["RBAC helper exists", "Enforce route exists", "Security status route exists", "Audit events route exists"]],
    ["UX", ["Final command center exists", "Navigation manifest exists", "Loading shell exists", "Empty state exists"]]
  ]

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Email-OS Final Readiness</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Final acceptance checklist for reliability, realtime, AI, security, and UX maturity.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {areas.map(([title, checks]) => (
            <div key={title as string} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-black text-slate-950">{title}</h2>
              <div className="mt-4 space-y-3">
                {(checks as string[]).map((check) => (
                  <label key={check} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3">
                    <input type="checkbox" className="h-4 w-4 cursor-pointer" />
                    <span className="text-sm font-bold text-slate-700">{check}</span>
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
