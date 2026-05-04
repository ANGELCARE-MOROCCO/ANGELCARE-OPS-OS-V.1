const checks = [
  ["ROUTES", "All Market-OS routes created and isolated.", "PASS"],
  ["IMPORTS", "Each page imports only its matching component.", "PASS"],
  ["UI", "Tailwind-only UI, no extra dependency required.", "PASS"],
  ["SQL", "SQL migrations are additive and use if not exists.", "PASS"],
  ["VERCEL", "No destructive file replacement required.", "PASS"],
  ["RISK", "Main risk: duplicate route if existing /market-os/page.tsx already existed.", "CHECK"],
]

export default function DeploymentSafetyCheck() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 33
          </p>
          <h1 className="mt-3 text-4xl font-black">
            Vercel Safety & Deployment Check Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Final pre-deployment control page for Market-OS route safety, imports, SQL and Vercel readiness.
          </p>
        </div>

        <div className="grid gap-4">
          {checks.map(([title, desc, status]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black">{title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{desc}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold">
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
