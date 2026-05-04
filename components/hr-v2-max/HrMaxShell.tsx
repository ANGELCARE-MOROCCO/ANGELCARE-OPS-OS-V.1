import Link from 'next/link'
import { Activity, AlertTriangle, ArrowRight, BadgeCheck, BarChart3, Bell, Briefcase, CalendarDays, CheckCircle2, ClipboardList, Database, FileText, Gauge, Layers, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { getHrMaximumSnapshot, hrMaxNav, type HrMetric, type HrRow } from '@/lib/hr-v2-max/sync'

function valueOf(row: HrRow, keys: string[]) {
  for (const key of keys) if (row?.[key]) return String(row[key])
  return '—'
}

export function HrHero({ title, subtitle, badge = 'HR V2 Maximum Execution' }: { title: string; subtitle: string; badge?: string }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950 px-6 py-8 text-white shadow-2xl">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-cyan-100">
            <Sparkles className="h-4 w-4" /> {badge}
          </div>
          <h1 className="max-w-5xl text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-200 md:text-lg">{subtitle}</p>
        </div>
        <div className="grid min-w-[280px] grid-cols-2 gap-3">
          <Link href="/hr/staff/new" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950 shadow-xl transition hover:scale-[1.02]">New Staff</Link>
          <Link href="/hr/roster/monthly" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-white/20">Monthly Roster</Link>
          <Link href="/hr/sync-control" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-white/20">Sync Control</Link>
          <Link href="/hr/actions" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-white/20">Action Queue</Link>
        </div>
      </div>
    </section>
  )
}

export function HrSubnav() {
  return (
    <nav className="sticky top-2 z-30 my-5 rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {hrMaxNav.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-900 hover:bg-slate-950 hover:text-white">
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export function MetricGrid({ metrics }: { metrics: HrMetric[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {metrics.map((m) => (
        <div key={m.label} className={`rounded-3xl bg-gradient-to-br ${m.tone} p-5 text-white shadow-xl`}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">{m.label}</p>
          <p className="mt-3 text-4xl font-black">{m.value}</p>
          <p className="mt-2 text-xs font-semibold text-white/80">{m.detail}</p>
        </div>
      ))}
    </section>
  )
}

export function ActionPanel() {
  const actions = [
    { icon: Users, title: 'Create Staff Profile', href: '/hr/staff/new', text: 'Add worker, assign role, department and contract baseline.' },
    { icon: CalendarDays, title: 'Plan Monthly Roster', href: '/hr/roster/monthly', text: 'Open duty calendar, coverage filters and shift planning.' },
    { icon: Bell, title: 'Push Memo', href: '/hr/memos', text: 'Prepare staff notification, reminder, HR instruction or alert.' },
    { icon: ShieldCheck, title: 'Compliance Review', href: '/hr/compliance', text: 'Check documents, incidents, certifications and approval risks.' },
    { icon: BarChart3, title: 'Payroll Preparation', href: '/hr/payroll-prep', text: 'Review attendance and salary preparation signals.' },
    { icon: Database, title: 'Sync Control', href: '/hr/sync-control', text: 'Inspect HR bridges to tasks, missions, pointage and incidents.' },
  ]
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {actions.map((a) => (
        <Link key={a.title} href={a.href} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="rounded-2xl bg-slate-950 p-3 text-white"><a.icon className="h-6 w-6" /></div>
            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-950" />
          </div>
          <h3 className="mt-5 text-xl font-black text-slate-950">{a.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{a.text}</p>
        </Link>
      ))}
    </section>
  )
}

export function DataTable({ title, rows, empty, route }: { title: string; rows: HrRow[]; empty: string; route?: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        {route ? <Link href={route} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Open</Link> : null}
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold text-slate-500">{empty}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          {rows.slice(0, 8).map((row, idx) => (
            <div key={row.id || idx} className="grid gap-2 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
              <div>
                <p className="font-black text-slate-900">{valueOf(row, ['full_name','name','title','message','reason','action','period','id'])}</p>
                <p className="text-xs font-semibold text-slate-500">{valueOf(row, ['department','position','type','role','category','status'])}</p>
              </div>
              <p className="text-sm font-bold text-slate-600">{valueOf(row, ['status','level','contract_type','severity','duty_type'])}</p>
              <p className="text-sm text-slate-500">{valueOf(row, ['created_at','shift_date','start_date','valid_until','updated_at'])}</p>
              <Link href={route || '/hr'} className="rounded-xl border border-slate-200 px-3 py-2 text-center text-xs font-black text-slate-700 hover:bg-slate-950 hover:text-white">Open</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function WorkflowBoard() {
  const flows = [
    ['Absence detected', 'Replacement required', 'Coverage risk', 'Notify supervisor'],
    ['New worker created', 'Assign position', 'Documents pending', 'Training path'],
    ['Incident created', 'Severity check', 'Corrective action', 'Closure audit'],
    ['Monthly payroll', 'Attendance review', 'Leave impact', 'Finance export'],
  ]
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">Operational Workflow Chains</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {flows.map((flow, i) => (
          <div key={i} className="rounded-3xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {flow.map((step, idx) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">{step}</span>
                  {idx < flow.length - 1 ? <ArrowRight className="h-4 w-4 text-slate-400" /> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function SyncMatrix({ snapshot }: { snapshot: Awaited<ReturnType<typeof getHrMaximumSnapshot>> }) {
  const bridges = [
    ['Staff', snapshot.staff.table, snapshot.staff.rows.length, '/hr/staff'],
    ['Roster', snapshot.roster.table, snapshot.roster.rows.length, '/hr/roster/monthly'],
    ['Leave', snapshot.leave.table, snapshot.leave.rows.length, '/hr/leave'],
    ['Missions', snapshot.missions.table, snapshot.missions.rows.length, '/missions'],
    ['Tasks', snapshot.tasks.table, snapshot.tasks.rows.length, '/revenue-command-center/tasks'],
    ['Attendance', snapshot.attendance.table, snapshot.attendance.rows.length, '/pointage'],
    ['Incidents', snapshot.incidents.table, snapshot.incidents.rows.length, '/hr/incidents'],
    ['Academy', snapshot.training.table, snapshot.training.rows.length, '/hr/training'],
  ]
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3"><Database className="h-6 w-6" /><h2 className="text-xl font-black text-slate-950">Data Synchronization Matrix</h2></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {bridges.map(([label, table, count, href]) => (
          <Link key={String(label)} href={String(href)} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-950 hover:text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{String(label)}</p>
            <p className="mt-2 text-3xl font-black">{String(count)}</p>
            <p className="mt-1 text-xs font-semibold opacity-70">Bridge: {String(table)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export async function HrMaximumDashboard({ mode = 'dashboard' }: { mode?: string }) {
  const snapshot = await getHrMaximumSnapshot()
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <HrHero title="AngelCare HR V2 Maximum Execution Command" subtitle="Premium corporate workforce control room with staff, roster, attendance, leave, tasks, missions, incidents, compliance, payroll preparation and synchronization signals in one operational layer." />
        <HrSubnav />
        <MetricGrid metrics={snapshot.metrics} />
        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-5">
            <ActionPanel />
            <SyncMatrix snapshot={snapshot} />
            <WorkflowBoard />
          </div>
          <div className="space-y-5">
            <DataTable title="Live HR Activity Feed" rows={snapshot.activity as any[]} empty="No live HR activity yet. Run migration 015 and start creating actions/memos." route="/hr/actions" />
            <DataTable title="Pending Approvals" rows={snapshot.approvals.rows} empty="No approval requests detected." route="/hr/approvals" />
          </div>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <DataTable title="Staff / Worker Signals" rows={snapshot.staff.rows} empty="No staff records found yet." route="/hr/staff" />
          <DataTable title="Monthly Roster Duties" rows={snapshot.roster.rows} empty="No roster duties found yet." route="/hr/roster/monthly" />
          <DataTable title="Positions Catalog" rows={snapshot.positions.rows} empty="No positions found yet." route="/hr/positions" />
          <DataTable title="Compliance / Incidents" rows={snapshot.incidents.rows} empty="No incidents found yet." route="/hr/incidents" />
        </div>
      </div>
    </main>
  )
}

export function HrModulePage({ title, subtitle, icon = 'layers', rows = [], empty = 'No records detected yet.', route = '/hr' }: { title: string; subtitle: string; icon?: string; rows?: HrRow[]; empty?: string; route?: string }) {
  const Icon = icon === 'users' ? Users : icon === 'calendar' ? CalendarDays : icon === 'shield' ? ShieldCheck : icon === 'gauge' ? Gauge : icon === 'file' ? FileText : icon === 'alert' ? AlertTriangle : icon === 'check' ? CheckCircle2 : icon === 'briefcase' ? Briefcase : icon === 'chart' ? BarChart3 : icon === 'database' ? Database : icon === 'activity' ? Activity : icon === 'clipboard' ? ClipboardList : icon === 'badge' ? BadgeCheck : Layers
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <HrHero title={title} subtitle={subtitle} />
        <HrSubnav />
        <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-3xl bg-slate-950 p-5 text-white"><Icon className="h-10 w-10" /><h2 className="mt-6 text-3xl font-black">Execution Controls</h2><p className="mt-3 text-sm leading-6 text-slate-300">Use this operational page to inspect records, trigger follow-up actions, and navigate directly into the related AngelCare workflow.</p></div>
            <div className="mt-5 grid gap-3">
              <Link href="/hr/actions" className="rounded-2xl border border-slate-200 px-4 py-3 font-black hover:bg-slate-950 hover:text-white">Create follow-up action</Link>
              <Link href="/hr/sync-control" className="rounded-2xl border border-slate-200 px-4 py-3 font-black hover:bg-slate-950 hover:text-white">Inspect sync bridge</Link>
              <Link href="/hr/memos" className="rounded-2xl border border-slate-200 px-4 py-3 font-black hover:bg-slate-950 hover:text-white">Push memo / reminder</Link>
            </div>
          </div>
          <DataTable title={title} rows={rows} empty={empty} route={route} />
        </section>
      </div>
    </main>
  )
}
