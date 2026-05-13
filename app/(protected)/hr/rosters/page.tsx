import AppShell from '@/app/components/erp/AppShell'
import Link from 'next/link'
import { getRosterCommandData } from '@/lib/hr-production/roster-enterprise'
import { RosterButton, RosterHero, RosterMetric, RosterPanel, RosterShell, RosterStatus, RosterTable } from '../_components/RosterEnterpriseUI'

function fmt(x: any) { return x ? String(x) : '—' }
function dateOf(x: any) { return fmt(x.work_date || x.date || x.shift_date) }
function timeOf(x: any) { return `${fmt(x.start_time)} → ${fmt(x.end_time)}` }

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string,string>> }) {
  const params = searchParams ? await searchParams : {}
  const view = params?.view || 'command'
  const { rosters, staff, conflicts, covered, errors } = await getRosterCommandData()
  const active = rosters.filter((x:any)=>String(x.status || '').toLowerCase() !== 'deleted')
  const coverageScore = active.length ? Math.round((covered.length / active.length) * 100) : 0
  const rows = active.slice(0, 140).map((x:any)=>[
    <Link key="shift" href={`/hr/rosters/${x.id}`} className="font-black text-slate-950 hover:underline">{x.title || x.shift_title || 'Shift'}</Link>,
    dateOf(x),
    timeOf(x),
    x.staff_name || x.staff_id || 'Unassigned',
    x.location || x.city || '—',
    <RosterStatus key="status" value={x.status || 'planned'} />,
    <div key="actions" className="flex flex-wrap gap-2"><Link className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white" href={`/hr/rosters/${x.id}`}>Open</Link><Link className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-700" href={`/hr/rosters/${x.id}/edit`}>Edit</Link></div>
  ])

  return <AppShell><RosterShell>
    <RosterHero title="Roster Command Center" subtitle="Premium scheduling layer with monthly, weekly, daily, agenda, people and conflict views; configurable shifts; repetition; full create/edit/delete control." score={coverageScore} actions={<><RosterButton href="/hr/rosters/new">+ Create shift</RosterButton><RosterButton href="/hr/rosters/repeat" variant="light">Repeat scheduler</RosterButton><RosterButton href="/hr/rosters/templates" variant="light">Templates</RosterButton><RosterButton href="/hr/rosters/conflicts" variant="light">Conflicts</RosterButton></>} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <RosterMetric title="Total shifts" value={active.length} detail="Active roster records" />
      <RosterMetric title="Covered" value={covered.length} detail="Confirmed / approved" />
      <RosterMetric title="Conflicts" value={conflicts.length} detail="Requires action" />
      <RosterMetric title="Staff pool" value={staff.length} detail="Available HR staff" />
      <RosterMetric title="Coverage" value={`${coverageScore}%`} detail="Readiness rate" />
      <RosterMetric title="Data alerts" value={Object.keys(errors || {}).length} detail="Repository alerts" />
    </section>
    <RosterPanel title="View controls" subtitle="Switch between roster views.">
      <div className="flex flex-wrap gap-2">{['command','month','week','day','agenda','people','conflicts'].map(v => <Link key={v} href={`/hr/rosters?view=${v}`} className={`rounded-full px-4 py-2 text-xs font-black ${view === v ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{v.toUpperCase()}</Link>)}</div>
    </RosterPanel>
    <RosterPanel title="Roster execution table" subtitle="Create, open, edit and control every synchronized shift.">
      <RosterTable headers={['Shift','Date','Time','Staff','Location','Status','Actions']} rows={rows} />
    </RosterPanel>
  </RosterShell></AppShell>
}
