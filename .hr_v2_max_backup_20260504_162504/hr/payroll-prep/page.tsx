import { getHrFinalCoreSnapshot } from '../lib/final-core-data'
import { HrFinalCoreHero, HrMetricGrid, HrSourceMatrix, HrUnifiedFeed } from '../components/HrFinalCoreUI'

export default async function Page() {
  const data = await getHrFinalCoreSnapshot()
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <HrFinalCoreHero title="Payroll Preparation Control" subtitle="Prepare payroll inputs from HR profiles, attendance, roster, absences, bonuses and deductions." />
        <HrMetricGrid cards={data.commandCards} />
        
        
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Payroll Preparation Rows</h2>
          <p className="mt-1 text-sm text-slate-500">Draft payroll periods and payroll items detected from HR payroll prep tables.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {data.rows.payrollPeriods.map((p:any) => (
              <div key={p.id} className="rounded-2xl border bg-slate-50 p-4">
                <div className="font-black">{p.period_label}</div>
                <div className="text-sm text-slate-500">{p.start_date} → {p.end_date}</div>
                <div className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{p.status}</div>
              </div>
            ))}
            {data.rows.payrollPeriods.length === 0 && <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">No payroll period yet. Create it from Supabase or next payroll action pack.</div>}
          </div>
        </div>
      </div>
    </main>
  )
}
