import { getHREnterpriseReadiness } from '@/lib/hr-enterprise/readiness'
export default async function Page(){
  const readiness = await getHREnterpriseReadiness()
  return <main className="p-6 space-y-6"><div className="rounded-3xl border bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-500">HR ENTERPRISE</p><h1 className="text-3xl font-bold text-slate-950">Enterprise Production Readiness</h1><p className="mt-2 text-slate-600">Score: <b>{readiness.readinessScore}%</b></p></div><div className="grid gap-4 md:grid-cols-2">{readiness.checks.map(c => <div key={c.key} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="font-bold text-slate-950">{c.label}</div><div className="mt-2 text-sm font-semibold">{c.passed ? 'PASSED' : 'NEEDS ACTION'}</div></div>)}</div></main>
}
