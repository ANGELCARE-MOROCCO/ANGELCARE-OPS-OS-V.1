import Link from 'next/link'
import { HrHero, HrSubnav, DataTable } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const snapshot = await getHrMaximumSnapshot()
  const worker = snapshot.staff.rows.find((r) => String(r.id) === id || String(r.user_id) === id) || snapshot.staff.rows[0] || { id, name: 'Worker profile' }
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <HrHero title={`Staff 360 — ${worker.full_name || worker.name || worker.position || worker.email || id}`} subtitle="Unified HR profile view with roster, attendance, missions, incidents, documents, approvals and action access." />
        <HrSubnav />
        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Worker Command Card</h2>
            <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-600">
              <p><b className="text-slate-950">ID:</b> {String(worker.id || id)}</p>
              <p><b className="text-slate-950">User:</b> {String(worker.user_id || '—')}</p>
              <p><b className="text-slate-950">Position:</b> {String(worker.position || worker.title || '—')}</p>
              <p><b className="text-slate-950">Department:</b> {String(worker.department || '—')}</p>
              <p><b className="text-slate-950">Status:</b> {String(worker.status || 'active')}</p>
            </div>
            <div className="mt-6 grid gap-3">
              <Link href="/hr/actions" className="rounded-2xl bg-slate-950 px-4 py-3 text-center font-black text-white">Create HR Action</Link>
              <Link href="/hr/roster/monthly" className="rounded-2xl border border-slate-200 px-4 py-3 text-center font-black">Open Roster</Link>
              <Link href="/hr/performance" className="rounded-2xl border border-slate-200 px-4 py-3 text-center font-black">Performance View</Link>
            </div>
          </div>
          <div className="space-y-5">
            <DataTable title="Roster / Duties" rows={snapshot.roster.rows.filter((r) => String(r.user_id || '') === String(worker.user_id || worker.id || id)).concat(snapshot.roster.rows.slice(0,3))} empty="No roster rows detected for this worker." route="/hr/roster/monthly" />
            <DataTable title="Incidents / Compliance" rows={snapshot.incidents.rows.slice(0,5)} empty="No incidents detected." route="/hr/incidents" />
          </div>
        </section>
      </div>
    </main>
  )
}
