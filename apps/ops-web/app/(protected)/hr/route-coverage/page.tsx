import Link from 'next/link'
import { getHRRouteCoverage } from '@/lib/hr-production/route-coverage'

export default function Page(){
  const routes = getHRRouteCoverage()
  return <main className="p-6 space-y-6">
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">HR CONTROL</p>
      <h1 className="text-3xl font-bold text-slate-950">HR Route Coverage Audit</h1>
      <p className="mt-2 text-slate-600">Enterprise checklist of HR pages that must not return 404.</p>
    </div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {routes.map(r => <Link key={r.route} href={r.route} className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md">
        <div className="font-semibold text-slate-950">{r.route}</div>
        <div className="mt-2 text-sm text-slate-500">Navigation: {r.inNavigation ? 'registered' : 'direct route'}</div>
      </Link>)}
    </div>
  </main>
}
