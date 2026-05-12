import Link from 'next/link'
export default function Page(){
  return <main className="p-6 space-y-6">
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">HR ENTERPRISE ROUTE</p>
      <h1 className="text-3xl font-bold text-slate-950">Roster Conflicts</h1>
      <p className="mt-2 text-slate-600">This page is wired as a production-safe route. Connect detailed CRUD widgets progressively through the HR repository layer.</p>
      <Link href="/hr" className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Back to HR</Link>
    </div>
  </main>
}
