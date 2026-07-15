import { HR_WORKFLOWS } from '@/lib/hr-erp/workflows'
export default function Page(){
  return <main className="p-6 space-y-6"><div className="rounded-3xl border bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-slate-500">HR ERP</p><h1 className="text-3xl font-bold text-slate-950">Real HR ERP Readiness</h1><p className="mt-2 text-slate-600">Lifecycle workflows, approvals, attendance-to-payroll, documents and audit control.</p></div><div className="grid gap-4 md:grid-cols-2">{HR_WORKFLOWS.map(w => <div key={w.key} className="rounded-2xl border bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-950">{w.label}</h2><ol className="mt-3 list-decimal pl-5 text-sm text-slate-600">{w.steps.map(s => <li key={s}>{s.replaceAll('_',' ')}</li>)}</ol></div>)}</div></main>
}
