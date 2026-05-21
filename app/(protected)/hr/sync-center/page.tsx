import { diagnoseHRSync } from '@/lib/hr-production/sync-repair'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const { issues } = await diagnoseHRSync()
  const critical = issues.filter(i => i.severity === 'critical').length
  return <main className="min-h-screen bg-slate-50 p-6 lg:p-10"><div className="mx-auto max-w-7xl space-y-6">
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">HR Sync Center</p><h1 className="mt-2 text-3xl font-black text-slate-950">Live HR diagnosis & repair cockpit</h1><p className="mt-2 text-slate-600">Detects broken links across candidate, staff, onboarding, contract, document, training, roster, attendance, and payroll chains.</p><div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Total issues</p><p className="text-3xl font-black">{issues.length}</p></div><div className="rounded-2xl bg-red-50 p-4"><p className="text-xs font-bold uppercase text-red-700">Critical</p><p className="text-3xl font-black text-red-700">{critical}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-bold uppercase text-emerald-700">Auto repairable</p><p className="text-3xl font-black text-emerald-700">{issues.filter(i => i.repairable).length}</p></div></div></section>
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm"><div className="divide-y divide-slate-100">{issues.length === 0 ? <p className="p-5 font-bold text-emerald-700">No sync issues detected. HR production chain is clean.</p> : issues.map((issue, idx) => <div key={`${issue.code}-${issue.entity_id || idx}`} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-bold text-slate-950">{issue.title}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{issue.code} · {issue.entity_type} · {issue.severity}</p></div><code className="rounded-xl bg-slate-100 px-3 py-2 text-xs">POST /api/hr/sync/repair</code></div>)}</div></section>
  </div></main>
}
