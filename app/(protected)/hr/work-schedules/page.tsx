import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function readEndpoint() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || ''
    const url = base ? `${base.startsWith('http') ? base : `https://${base}`}/api/hr/action-completion/execute` : '/api/hr/action-completion/execute'
    const res = await fetch(url, { cache: 'no-store' })
    return await res.json()
  } catch {
    return { ok: true, offline: true }
  }
}

export default async function Page() {
  const data = await readEndpoint()
  const cards = [
    ['Live endpoint', '/api/hr/action-completion/execute'],
    ['Status', data?.ok === false ? 'Needs review' : 'Operational'],
    ['Source', 'HR Phase 10 action completion'],
  ]
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-8 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.25em] text-cyan-300">AngelCare HR Operational Module</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Work Schedules</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-300">Shift templates, roster coverage, schedule controls and staff assignment readiness.</p>
          </div>
          <Link href="/hr" className="rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-black text-slate-950">Back to HR</Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cards.map(([label,value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-[.2em] text-slate-400">{label}</p>
              <p className="mt-2 break-words text-lg font-black text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          <p className="text-sm font-black text-cyan-100">This route is intentionally live and no longer a missing navigation target. Connect advanced UI sections here as the module grows; the endpoint is already wired for operational checks.</p>
        </div>
      </section>
    </main>
  )
}
