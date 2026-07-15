import { runHrActionabilityAudit } from '@/lib/hr-actionability/audit-engine'

const tone: Record<string, string> = {
  live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  static: 'bg-slate-50 text-slate-700 border-slate-200',
  broken: 'bg-red-50 text-red-700 border-red-200',
  missing_api: 'bg-rose-50 text-rose-700 border-rose-200',
  missing_route: 'bg-orange-50 text-orange-700 border-orange-200',
  unknown: 'bg-violet-50 text-violet-700 border-violet-200',
}

export const dynamic = 'force-dynamic'

export default function HRActionabilityAuditPage() {
  const audit = runHrActionabilityAudit()
  const priority = audit.actions.filter((a) => ['missing_api','missing_route','static','unknown','partial'].includes(a.status)).slice(0, 120)
  const cards = [
    ['Files scanned', audit.totals.files], ['HR routes', audit.totals.routes], ['Actions found', audit.totals.actions],
    ['Live', audit.totals.live], ['Partial', audit.totals.partial], ['Static', audit.totals.static],
    ['Missing API', audit.totals.missing_api], ['Missing route', audit.totals.missing_route], ['Unknown', audit.totals.unknown],
  ]
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950 lg:p-10">
      <section className="mx-auto max-w-7xl rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-violet-600">HR Phase 09</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Total actionability audit</h1>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-500">Scans HR routes, components, links, buttons, forms, API calls, route existence, static placeholders and mutation signals. This page is diagnostic only and does not change production data.</p>
          </div>
          <a href="/api/hr/actionability-audit" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg">Open JSON</a>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-3 lg:grid-cols-9">
          {cards.map(([label, value]) => <div key={label} className="rounded-3xl border border-slate-100 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase text-slate-400">{label}</p><p className="mt-2 text-2xl font-black">{String(value)}</p></div>)}
        </div>
      </section>
      <section className="mx-auto mt-6 max-w-7xl rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Priority action list</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">Start with missing APIs/routes, then convert static and unknown actions into real server actions.</p>
        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500"><tr><th className="p-4">Status</th><th>Kind</th><th>Label / Target</th><th>Route</th><th>Reason</th></tr></thead>
            <tbody>{priority.map((a, i) => <tr key={`${a.file}-${i}`} className="border-t border-slate-100 align-top"><td className="p-4"><span className={`rounded-full border px-3 py-1 text-xs font-black ${tone[a.status] || tone.unknown}`}>{a.status}</span></td><td className="font-bold text-slate-600">{a.kind}</td><td className="max-w-sm py-4"><p className="font-black">{a.label}</p><p className="mt-1 text-xs font-bold text-slate-400">{a.target}</p></td><td className="max-w-xs py-4 text-xs font-bold text-slate-500">{a.file}</td><td className="max-w-md py-4 text-xs font-semibold leading-6 text-slate-500">{a.reason}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
