import AppShell from '@/app/components/erp/AppShell'
import Link from 'next/link'
import { getAttendanceEnterpriseData, markReviewAttendanceAction } from '@/lib/hr-production/attendance-enterprise'
import { AttendanceEnterpriseShell, AttendanceTopbar, AttendanceSidebar, MetricCard, Panel, StatusBadge, TimelineRow, MiniTable } from '../_components/AttendanceEnterpriseUI'

function time(v: any) {
  return v ? String(v).slice(11, 16) : '—'
}

function schedule(r: any) {
  return `${time(r.punch_in_at)}    ${time(r.punch_out_at)}`
}

function startPct(i: number) {
  return 6 + ((i * 7) % 28)
}

function widthPct(i: number, status: string) {
  return /absent|missing/i.test(status) ? 45 : 42 + ((i * 5) % 28)
}

function samePerson(a: any, b: any) {
  const av = a?.identity?.staff_id || a?.identity?.user_id || a?.identity?.name
  const bv = b?.identity?.staff_id || b?.identity?.user_id || b?.identity?.name
  return String(av || '') === String(bv || '')
}

function staffHref(r: any) {
  const id = r?.identity?.staff_id || r?.identity?.user_id || r?.identity?.name || 'staff'
  return `/hr/attendance/staff/${encodeURIComponent(String(id))}`
}

function StaffIntelligencePanel({ selected, records }: { selected: any; records: any[] }) {
  if (!selected) {
    return (
      <Panel title="Staff Intelligence" subtitle="Select a staff lane to inspect details.">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm font-semibold text-slate-400">
          No staff selected.
        </div>
      </Panel>
    )
  }

  const related = records.filter((r) => samePerson(r, selected))
  const mapped = selected.identity?.staff_id && !/unmapped|overhead identity/i.test(selected.identity?.name || '')
  const validated = related.filter((r) => /present|auto|valid|complete|approved/i.test(r.status)).length
  const risks = related.filter((r) => /late|missing|absent|review|pending|exception/i.test(r.status)).length
  const overtime = related.reduce((sum, r) => sum + Number(r.overtime_minutes || 0), 0)
  const totalMinutes = related.reduce((sum, r) => sum + Number(r.total_minutes || 0), 0)
  const source = selected.identity_resolution_source || selected.identity?.resolution_source || selected.source_table || selected.source || 'attendance'

  return (
    <Panel
      title="Staff Intelligence"
      subtitle="Selected staff profile, live punch status, data source, risks and actions."
      action={<StatusBadge value={mapped ? 'mapped' : 'needs mapping'} />}
    >
      <div className="space-y-4">
        <div className="rounded-[24px] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-2xl font-black text-slate-950 shadow-[0_0_24px_rgba(45,212,191,.25)]">
              {String(selected.identity?.name || 'S').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-2xl font-black text-white">{selected.identity?.name || 'Unmapped staff'}</h3>
              <div className="mt-1 text-sm font-bold text-slate-400">
                {selected.identity?.role || 'Staff'} · {selected.identity?.department || 'Unmapped department'}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge value={selected.status || 'pending'} />
                <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[.14em] text-slate-400">
                  {source}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Punch in</div>
            <div className="mt-2 text-2xl font-black text-emerald-300">{time(selected.punch_in_at)}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Punch out</div>
            <div className="mt-2 text-2xl font-black text-sky-300">{time(selected.punch_out_at)}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Location</div>
            <div className="mt-2 text-sm font-black text-white">{selected.identity?.location || 'Head Office'}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Work date</div>
            <div className="mt-2 text-sm font-black text-white">{selected.work_date || '—'}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-2xl bg-slate-950 p-3">
            <div className="text-xl font-black text-white">{related.length}</div>
            <div className="text-[10px] font-black uppercase text-slate-500">records</div>
          </div>
          <div className="rounded-2xl bg-slate-950 p-3">
            <div className="text-xl font-black text-emerald-300">{validated}</div>
            <div className="text-[10px] font-black uppercase text-slate-500">valid</div>
          </div>
          <div className="rounded-2xl bg-slate-950 p-3">
            <div className="text-xl font-black text-rose-300">{risks}</div>
            <div className="text-[10px] font-black uppercase text-slate-500">risk</div>
          </div>
          <div className="rounded-2xl bg-slate-950 p-3">
            <div className="text-xl font-black text-violet-300">{overtime}</div>
            <div className="text-[10px] font-black uppercase text-slate-500">OT min</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Recent signals</div>
            <div className="text-xs font-bold text-slate-400">{Math.round(totalMinutes / 60)}h tracked</div>
          </div>
          <div className="space-y-2">
            {related.slice(0, 6).map((r, i) => (
              <div key={r.id || i} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#07111f] px-3 py-2">
                <div>
                  <div className="text-xs font-black text-white">{r.work_date || '—'}</div>
                  <div className="text-[11px] font-semibold text-slate-500">{r.source_table || r.source || 'attendance'}</div>
                </div>
                <StatusBadge value={r.status || 'pending'} />
              </div>
            ))}
            {!related.length ? <div className="text-sm font-semibold text-slate-500">No related records found.</div> : null}
          </div>
        </div>

        <div className="grid gap-2">
          <Link className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-blue-950/30" href={staffHref(selected)}>
            Open Full Attendance Profile
          </Link>
          {selected.identity?.staff_id ? (
            <Link className="rounded-2xl border border-slate-700 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-900" href={`/hr/staff/${selected.identity.staff_id}`}>
              Open Staff Command
            </Link>
          ) : (
            <Link className="rounded-2xl border border-amber-500/40 px-4 py-3 text-center text-sm font-black text-amber-300 hover:bg-amber-500/10" href="/hr/attendance/identity-map">
              Map Identity Now
            </Link>
          )}
          <Link className="rounded-2xl border border-slate-700 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-900" href="/hr/attendance/actions">
            Create HR Action
          </Link>
        </div>
      </div>
    </Panel>
  )
}

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = searchParams ? await searchParams : {}
  const view = params?.view || 'timeline'
  const q = String(params?.q || '').toLowerCase()
  const data = await getAttendanceEnterpriseData()
  const records = q
    ? data.records.filter((r: any) => [
        r.identity?.name,
        r.identity?.role,
        r.identity?.department,
        r.identity?.location,
        r.status,
        r.source_table,
      ].join(' ').toLowerCase().includes(q))
    : data.records

  const selected = records[0]

  const deptRows = Array.from(data.departments.entries()).map(([name, d]: any) => [
    name,
    d.present,
    d.late,
    d.absent,
    d.total,
    `${d.total ? Math.round((d.present / d.total) * 100) : 0}%`,
  ])

  const feedRows = (data.logs || []).slice(0, 6).map((x: any) => [
    String(x.event_at || x.created_at || '').slice(11, 16),
    x.event_type || 'punch',
    <StatusBadge key="b" value={x.source || 'live'} />,
  ])

  const exceptionRows = data.exceptions.slice(0, 80).map((r: any) => [
    r.work_date,
    <Link key="s" href={staffHref(r)} className="font-black text-white underline">{r.identity.name}</Link>,
    r.identity.department,
    <StatusBadge key="st" value={r.status} />,
    <form key="f" action={markReviewAttendanceAction.bind(null, r.id)}>
      <button className="rounded-full border border-amber-400/40 px-3 py-1 text-xs font-black text-amber-300">Review</button>
    </form>,
  ])

  return (
    <AppShell>
      <AttendanceEnterpriseShell>
        <AttendanceTopbar />
        <div className="flex">
          <AttendanceSidebar />
          <main className="min-w-0 flex-1 p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-white">
                  Attendance Live Monitor <span className="rounded-full bg-emerald-500 px-2 py-1 text-xs text-slate-950">LIVE</span>
                </h1>
                <p className="mt-1 text-sm text-slate-400">Real-time attendance tracking and workforce status overview</p>
              </div>
              <form className="flex gap-2">
                <input name="q" defaultValue={q} placeholder="Search staff, department..." className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-white" />
                <button className="rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950">Filter</button>
              </form>
            </div>

            <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard tone="purple" label="Total staff" value={data.staff.length || data.byPerson.size || data.records.length} detail={`${data.mapped.length} mapped identities`} />
              <MetricCard tone="green" label="Present now" value={data.present.length} detail={`${data.records.length ? Math.round((data.present.length / data.records.length) * 100) : 0}% of records`} />
              <MetricCard tone="blue" label="On time" value={Math.max(0, data.present.length - data.late.length)} detail="validated / auto synced" />
              <MetricCard tone="amber" label="Late" value={data.late.length} detail="needs review" />
              <MetricCard tone="red" label="Absent" value={data.absent.length} detail="absence signals" />
            </section>

            <div className="mb-5 flex flex-wrap gap-2">
              {['timeline', 'people', 'exceptions', 'departments', 'payroll', 'live'].map((v) => (
                <Link key={v} href={`/hr/attendance?view=${v}`} className={`rounded-full px-4 py-2 text-xs font-black ${view === v ? 'bg-white text-slate-950' : 'border border-slate-700 text-white'}`}>
                  {v.toUpperCase()}
                </Link>
              ))}
            </div>

            {view === 'exceptions' ? (
              <Panel title="Exception Command Board" subtitle="Late, missing, pending and review signals with HR action buttons.">
                <MiniTable headers={['Date', 'Staff', 'Department', 'Status', 'Action']} rows={exceptionRows} />
              </Panel>
            ) : view === 'people' ? (
              <Panel title="Individual Attendance Panels" subtitle="Every person opens into a dedicated attendance control profile.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {Array.from(data.byPerson.entries()).slice(0, 80).map(([key, items]: any) => {
                    const first = items[0]
                    return (
                      <Link key={key} href={staffHref(first)} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 hover:border-emerald-400/50">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-black text-white">{first.identity.name}</div>
                            <div className="mt-1 text-xs text-slate-500">{first.identity.role} · {first.identity.department}</div>
                          </div>
                          <StatusBadge value={first.status} />
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-slate-950 p-2"><b className="text-white">{items.length}</b><div className="text-[10px] text-slate-500">records</div></div>
                          <div className="rounded-xl bg-slate-950 p-2"><b className="text-emerald-300">{items.filter((x: any) => /present|auto|valid|completed/i.test(x.status)).length}</b><div className="text-[10px] text-slate-500">valid</div></div>
                          <div className="rounded-xl bg-slate-950 p-2"><b className="text-rose-300">{items.filter((x: any) => /review|late|absent/i.test(x.status)).length}</b><div className="text-[10px] text-slate-500">risk</div></div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </Panel>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
                <Panel title="Live Attendance Timeline" subtitle="Staff lane scheduler with punch status, identity, and clickable profiles.">
                  <div className="overflow-hidden rounded-2xl border border-slate-800">
                    <div className="grid grid-cols-[42px_240px_110px_1fr_130px] bg-slate-900 px-3 py-3 text-xs font-black uppercase tracking-[.14em] text-slate-500">
                      <div></div>
                      <div>Staff</div>
                      <div>Schedule</div>
                      <div className="grid grid-cols-6 text-center"><span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span><span>18:00</span></div>
                      <div>Status</div>
                    </div>
                    {records.slice(0, 16).map((r: any, i: number) => (
                      <TimelineRow
                        key={r.id + i}
                        name={r.identity.name}
                        role={`${r.identity.role} · ${r.identity.department}`}
                        schedule={schedule(r)}
                        status={r.status}
                        startPct={startPct(i)}
                        widthPct={widthPct(i, r.status)}
                        href={staffHref(r)}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-5 text-xs font-bold text-slate-400">
                    <span>🟩 Present</span><span>🟧 Late</span><span>🟥 Absent</span><span>🟪 Overtime</span><span>⬛ Not In</span>
                  </div>
                </Panel>

                <StaffIntelligencePanel selected={selected} records={records} />
              </div>
            )}

            <div className="mt-5 grid gap-5 xl:grid-cols-3">
              <Panel title="Attendance Summary Today">
                <div className="grid place-items-center rounded-2xl bg-slate-950 p-6">
                  <div className="grid h-40 w-40 place-items-center rounded-full border-[18px] border-emerald-500 text-center">
                    <div><div className="text-3xl font-black text-white">{data.records.length}</div><div className="text-xs text-slate-500">Total</div></div>
                  </div>
                </div>
              </Panel>
              <Panel title="Department Overview">
                <MiniTable headers={['Department', 'Present', 'Late', 'Absent', 'Total', 'Rate']} rows={deptRows} />
              </Panel>
              <Panel title="Live Activity Feed">
                <MiniTable headers={['Time', 'Event', 'Source']} rows={feedRows} />
              </Panel>
            </div>
          </main>
        </div>
      </AttendanceEnterpriseShell>
    </AppShell>
  )
}
