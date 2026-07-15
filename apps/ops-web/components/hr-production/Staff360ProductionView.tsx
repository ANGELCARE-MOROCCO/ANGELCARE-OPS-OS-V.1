import Link from 'next/link'

function rows(value: any[] | undefined) { return Array.isArray(value) ? value : [] }
function label(row: any) { return row.title || row.name || row.full_name || row.status || row.event_type || row.id || 'Record' }

function Card({ title, items, hrefBase }: { title: string; items: any[]; hrefBase?: string }) {
  const data = rows(items).slice(0, 8)
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">{title}</h2>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{rows(items).length}</span>
    </div>
    {data.length === 0 ? <p className="text-sm text-slate-500">No linked live records yet.</p> : <div className="space-y-3">{data.map((item) => <div key={item.id || JSON.stringify(item)} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">{label(item)}</p>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-600">{item.status || item.stage || 'live'}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleString() : item.due_at || item.shift_date || item.period || ''}</p>
      {hrefBase && item.id ? <Link className="mt-2 inline-flex text-xs font-bold text-blue-700" href={`${hrefBase}/${item.id}`}>Open record →</Link> : null}
    </div>)}</div>}
  </section>
}

export default function Staff360ProductionView({ data }: { data: any }) {
  const staff = data?.staff || {}
  const fullName = staff.full_name || staff.name || staff.email || 'Staff profile'
  return <main className="min-h-screen bg-slate-50 p-6 lg:p-10">
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">HR Staff 360 Live Production Profile</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{fullName}</h1>
            <p className="mt-2 text-sm text-slate-600">Every block below is filtered from the production HR source of truth using this staff identity.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white" href="/hr/sync-center">Run sync checks</Link>
            <Link className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800" href="/hr/employees">Back to employees</Link>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[['Status', staff.status], ['Email', staff.email], ['Phone', staff.phone], ['Hire date', staff.hire_date]].map(([k, v]) => <div key={k} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">{k}</p><p className="mt-1 font-bold text-slate-950">{v || '—'}</p></div>)}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Onboarding" items={data?.onboarding} />
        <Card title="Contracts" items={data?.contracts} />
        <Card title="Documents" items={data?.documents || data?.docs} />
        <Card title="Training" items={data?.training || data?.trainings} />
        <Card title="Attendance" items={data?.attendance} />
        <Card title="Rosters" items={data?.rosters || data?.rosterAssignments} />
        <Card title="Payroll" items={data?.payroll} />
        <Card title="Performance" items={data?.performance || data?.reviews} />
        <Card title="Approvals / Tasks" items={[...(data?.approvals || []), ...(data?.tasks || [])]} />
      </div>
    </div>
  </main>
}
